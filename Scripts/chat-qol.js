(function () {
    "use strict";
    if (window !== window.top) return;

    let defaultIconStateApplied = false;

    setInterval(() => {
        try {
            if (typeof Player !== "undefined" && Player && Player.ImmersionSettings) {
                // Feature 1: Force Ungarbled Messages
                if (!Player.ImmersionSettings.ShowUngarbledMessages) {
                    Player.ImmersionSettings.ShowUngarbledMessages = true;
                    let cb = document.getElementById("preference-immersion-ShowUngarbledMessages");
                    if (cb && !cb.checked) {
                        cb.checked = true;
                    }
                }

                // Feature 2: Default Chat Room Icons to Squinted 1x (State 1) upon login
                // We check if we are in ChatRoom (ChatRoomHideIconState is usually defined globally)
                // If it is globally defined and we haven't applied our default yet:
                if (!defaultIconStateApplied && typeof ChatRoomHideIconState !== "undefined") {
                    if (window.ChatRoomHideIconState === 0) {
                        window.ChatRoomHideIconState = 1;
                        defaultIconStateApplied = true;
                    }
                }
                
                // Fallback in case ChatRoomHideIconState is initialized later when joining a room
                if (typeof CurrentScreen !== "undefined" && CurrentScreen === "ChatRoom") {
                     if (!defaultIconStateApplied && typeof ChatRoomHideIconState !== "undefined") {
                         if (window.ChatRoomHideIconState === 0) {
                             window.ChatRoomHideIconState = 1;
                         }
                         defaultIconStateApplied = true;
                     }
                }
            }
        } catch (e) {}
    }, 2000);
})();
