"use strict";

const NotificationIcons = Object.freeze({
  CONSTRUCTION:   { class: "bi-box-seam-fill", color: "#FFF" },
  CRITICAL_ERROR:  { class: "bi-exclamation-octagon", color: "#F00" },
  ERROR:  { class: "bi-exclamation-triangle", color: "#F00" },
  WARNING: { class: "bi-exclamation-triangle", color: "#FA0" },
  SUCCESS: { class: "bi-patch-check", color: "#0F0" },
  INFO: { class: "bi-exclamation-circle", color: "#FFF" },
  NONE: { class: "", color: "#FFF" }
});

// setup area for notifications to appear in
let notificationsArea = elem("div", { class: "sk-notification-area" });
document.body.appendChild(notificationsArea);


function displayEditorNotification(message, icon=NotificationIcons.NONE, timeout=null, callback=null){
    // set default timeout (if necessary)
    if (timeout == null){
        if (icon == NotificationIcons.CRITICAL_ERROR)
            timeout = -1; // show indefinitely if critical error
        else
            timeout = 1.5; // show for 1.5 seconds if info/warning
    }

    // construct notification
    let notificationIcon = elem("span", { class: icon.class, style: {color: icon.color} });

    let notificationText = elem("div", { class: "sk-notification-body" }, [elemFromText(message)]);

    let notificationCloseButton = elem("button", { class: "bi bi-x-lg" });
    let notificationCloseButtonWrapper = elem("div", {}, [notificationCloseButton]);

    let notification = elem("div", {
        class: "sk-contents sk-notification",
        style: {
            cursor: callback != null ? "pointer" : ""
        }
    }, [
        notificationIcon,
        notificationText,
        notificationCloseButtonWrapper
    ]);

    let timeoutID = null;

    // setup functions for interaction
    let deleteNotification = function (){
        notification.style.pointerEvents = "none";
        // fadeout to _almost_ fully transparent,
        // to avoid frames where it's invisible
        // yet still taking space
        notification.style.opacity = 0.02;

        clearTimeout(timeoutID);

        // once the fadeout ends, remove the element
        notification.addEventListener('transitionend', function(event){
            if (event.propertyName == 'opacity')
                notificationsArea.removeChild(notification);
        });
    }

    let timeoutFunc = function() {
        deleteNotification();
    }

    // add events
    notificationCloseButton.addEventListener("click", function(event) {
        event.stopPropagation();
        deleteNotification();
    });

    notification.addEventListener("click", function(event){
        event.stopPropagation();
        deleteNotification();
        if (callback != null)
            callback();
    });

    // add it to the page
    if (timeout > 0)
        timeoutID = setTimeout(timeoutFunc, timeout * 1000);
    notificationsArea.appendChild(notification);

    // attach the delete function to the notification element, that way it can be called externally
    notification.deleteNotification = deleteNotification;

    return notification;
}