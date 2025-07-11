class ActionCancelled extends Error {
  constructor(message = "", ...args) {
    super(message, ...args);
    this.message = "Cancelled the action!";
  }
}
class ActionQueue extends EventTarget {

    constructor(name, concurrency) {
        super();
        this.name = name;
        this.concurrency = concurrency;
        this.queue = [];
        this.current = null;

        this.isConsuming = false;

        if (!this.concurrency.synchronousWith) this.concurrency.synchronousWith = [];
        if (!this.concurrency.waitOn) this.concurrency.waitOn = [];
        if (!this.concurrency.cancelOn) this.concurrency.cancelOn = [];

        let self = this;

        ActionQueue.OnClear(this.concurrency.waitOn, function() {
            // Start the consume loop if required
                self.Consume();
        });

        for (let i = 0; i < this.concurrency.cancelOn.length; i ++) {
            let targetQueue = this.concurrency.cancelOn[i];
            // cancel and clear when target queue has an action added
            targetQueue.addEventListener("onAddedOne", function() {
                if (self.isClear())
                    return;

                self.log("    Clearing all due to " + self.concurrency.cancelOn[i].name + " queue having an item added");

                self.cancelCurrent();
                self.queue = [];
            });

            // we also want the target queue to _wait_ for this queue to finish up whatever it was doing
            if (targetQueue.concurrency.synchronousWith.indexOf(this) < 0) {
                targetQueue.concurrency.synchronousWith.push(this);
                ActionQueue.OnConsumedOne([this], function() {
                    // Start the consume loop if required
                    targetQueue.Consume();
                });
            }

        }
    }

    isClear() {
        return this.queue.length == 0 && this.current == null;
    }

    isExecuting() {
        return this.current != null;
    }

    async cancelCurrent() {
        if (this.current != null)
            try {
                await this.current.cancel();
                await this.current.promise;
            }
            catch(err) {}
    }

    log(text){
        //console.log(this.name, text); // uncomment to help with debugging... TODO: Maybe this can be made tidier?
    }

    async Schedule(name, func) {
        this.log("Scheduling " + name);
        this.queue.push({name:name, func:func});
        // Cancel if this will exceed the max queue length _including_ the current executing one
        if (this.queue.length >= this.concurrency.maxQueued && this.concurrency.cancelRunning && this.current != null) {
            this.log("    Cancelling current");
            this.cancelCurrent();
        }

        // Remove the first queued one if adding this will exceed the max queue length
        if (this.queue.length > this.concurrency.maxQueued && this.concurrency.replaceQueued) {
            this.log("    Remove first queued");
            this.queue.splice(0, 1);
        }

        // Remove any items in the queue past the queue length
        this.queue.splice(0, this.queue.length - this.concurrency.maxQueued);
        this.log("    There are now " + this.queue.length + " items queued");

        this.dispatchEvent(new Event("onAddedOne"));

        // Start the consume loop if required
        if (!this.isConsuming) {
            this.log("    Begin the consume loop");
            this.Consume();
        }
    }

    async Consume() {
        // guard against running this multiple times simultaneously
        if (this.isConsuming)
            return;

        this.isConsuming = true;
        this.log("Consume loop began");

        consumeLoop:
        while(this.queue.length > 0) {
            this.log("Consume");

            // first wait for all waitOn queues to completely empty
            for (let i = 0; i < this.concurrency.waitOn.length; i ++) {
                if (!this.concurrency.waitOn[i].isClear()) {
                    this.log("    Waiting on " + this.concurrency.waitOn[i].name + " queue to finish all tasks");
                    break consumeLoop;
                }
            }

            // also wait for all synchronousWith queues to finish their current task
            for (let i = 0; i < this.concurrency.synchronousWith.length; i ++) {
                if (this.concurrency.synchronousWith[i].isExecuting()) {
                    this.log("    Waiting on " + this.concurrency.synchronousWith[i].name + " queue to finish current task");
                    break consumeLoop;
                }
            }


            // create the 'action'
            this.log("    Starting action " + this.queue[0].name);
            let action = {promise: null, cancelled: false, cancel: null};

            // this function cancels the action
            let cancelFunc = function() {
                action.cancelled = true;
            };

            // this function checks if the action is cancelled, and throws if it is
            // can be called at any point inside an action's function
            let checkCancelled = function() {
                if (action.cancelled)
                    throw new ActionCancelled();
            };

            // fill in the action, and actually start the function
            action.cancel = cancelFunc;
            action.promise = this.queue[0].func(checkCancelled);
            action.name = this.queue[0].name; // mainly for debugging
            action.origFunc = this.queue[0].func; // mainly for debugging
            this.current = action;

            // remove the first element from the queue (since we've started it)
            this.queue.splice(0, 1);


            // wait for the action to finish, and catch any errors
            this.log("    Waiting for current task to finish");
            try {
                await this.current.promise;
            } catch (err){
                this.log("    Current task ended with error:");
                this.log(err);
            }

            this.log("    Current task finished");

            // tidy up and signal completion, then loop again and see if there
            // are any other actions to run
            this.current = null;
            this.dispatchEvent(new Event("onConsumedOne"));
        }

        this.isConsuming = false;
        this.log("Consume loop ended");
    }

    static OnClear(queues, func) {
        for (let i = 0; i < queues.length; i ++) {
            let self = this;
            queues[i].addEventListener("onConsumedOne", function() {
                for (let i = 0; i < queues.length; i ++) {
                    if (!queues[i].isClear())
                        return;
                }
                func();
            });
        }
    }

    static OnConsumedOne(queues, func) {
        for (let i = 0; i < queues.length; i ++) {
            let self = this;
            queues[i].addEventListener("onConsumedOne", function() {
                func();
            });
        }
    }

};

