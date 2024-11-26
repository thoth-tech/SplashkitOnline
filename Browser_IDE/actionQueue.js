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

        let self = this;

        ActionQueue.OnClear(this.concurrency.waitOn, function() {
            // Start the consume loop if required
            if (self.current == null)
                self.Consume();
        });

        if (this.concurrency.cancelOn)
            for (let i = 0; i < this.concurrency.cancelOn.length; i ++) {
                this.concurrency.cancelOn[i].addEventListener("onAddedOne", function() {
                    self.log("    Clearing all to " + self.concurrency.cancelOn[i].name + " queue having an item added");
                    if (self.current != null)
                        try{self.current.cancelled.cancel(new ActionCancelled());}catch(err){}
                    self.queue = [];
                });
            }
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
            try{this.current.cancelled.cancel(new ActionCancelled());}catch(err){}
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
        if (this.current == null) {
            this.log("    Begin the consume loop");
            this.Consume();
        }
    }

    async Consume() {
        this.log("Consume");
        if (this.current != null) {
            this.log("    Waiting for current task to finish");
            try {
                await this.current.promise;
            } catch (err){
                this.log("    Current task ended with error:");
                this.log(err);
            }
            this.log("    Current task finished");
        }

        for (let i = 0; i < this.concurrency.waitOn.length; i ++) {
            if (this.concurrency.waitOn[i].queue.length != 0 || this.concurrency.waitOn[i].current != null) {
                this.log("    Waiting on " + this.concurrency.waitOn[i].name + " queue to finish");
                return;
            }
        }

        if (this.queue.length > 0) {
            this.log("    Starting activity "+this.queue[0].name);
            let action = {promise: null, cancelled: null};


            let resolved = Promise.resolve();
            let cancelFunc = null;
            let cancellable = new Promise(function (resolve, reject) {cancelFunc = reject;});
            let checkCancelled = function(){return Promise.race([cancellable, resolved]);};
            checkCancelled.cancelledPromise = cancellable;
            checkCancelled.cancel = cancelFunc;
            action.cancelled = checkCancelled;
            action.promise = this.queue[0].func(checkCancelled);
            let self = this;
            action.promise.then(function() {self.current = null; self.dispatchEvent(new Event("onConsumedOne"));} );
            action.promise.catch(function(err){console.log("ERROR", self.name, err);});
            this.current = action;
            this.queue.splice(0, 1);
            this.Consume();
            return;
        }
    }

    static OnClear(queues, func) {
        for (let i = 0; i < queues.length; i ++) {
            let self = this;
            queues[i].addEventListener("onConsumedOne", function() {
                for (let i = 0; i < queues.length; i ++) {
                    if (queues[i].queue.length != 0 || queues[i].current != null)
                        return;
                }
                func();
            });
        }
    }

};

