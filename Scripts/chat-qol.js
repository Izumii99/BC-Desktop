(function () {
    "use strict";
    if (window !== window.top) return;

    let defaultIconStateApplied = false;

    setInterval(() => {
        try {
            if (typeof Player !== "undefined" && Player && Player.ImmersionSettings) {
                // Force ungarbled messages
                if (!Player.ImmersionSettings.ShowUngarbledMessages) {
                    Player.ImmersionSettings.ShowUngarbledMessages = true;
                    let cb = document.getElementById("preference-immersion-ShowUngarbledMessages");
                    if (cb && !cb.checked) {
                        cb.checked = true;
                    }
                }

                // Persist Chat Room Icons State (Hide Icon) across reconnects
                if (typeof window.qolSavedIconState === "undefined") {
                    window.qolSavedIconState = 1; // Default to squinted 1x
                    if (typeof window.ChatRoomHideIconState !== "undefined" && window.ChatRoomHideIconState === 0) {
                        window.ChatRoomHideIconState = 1;
                    }
                }

                if (typeof window.ChatRoomLoad === "function" && !window.ChatRoomLoad.hasQolHook) {
                    const origChatRoomLoad = window.ChatRoomLoad;
                    window.ChatRoomLoad = function() {
                        origChatRoomLoad.apply(this, arguments);
                        if (typeof window.ChatRoomHideIconState !== "undefined") {
                            window.ChatRoomHideIconState = window.qolSavedIconState;
                        }
                    };
                    window.ChatRoomLoad.hasQolHook = true;
                }

                // Update saved state when user manually clicks the eye icon
                if (typeof CurrentScreen !== "undefined" && CurrentScreen === "ChatRoom" && typeof window.ChatRoomHideIconState !== "undefined") {
                    window.qolSavedIconState = window.ChatRoomHideIconState;
                }
            }
        } catch (e) {}
    }, 2000);

    // Shift+Tab / Tab shortcut for LianChat navigation
    document.addEventListener("keydown", (e) => {
        let senderList = document.getElementById("LC-Message-SenderList");
        let isLianChatOpen = senderList && senderList.offsetParent !== null;

        if (e.key === "Tab") {
            e.preventDefault();

            if (isLianChatOpen) {
                // Filter only online friends (marked by strong class)
                let items = Array.from(senderList.querySelectorAll(".lc-conv-item")).filter(item => {
                    return item.offsetParent !== null && item.querySelector(".lc-conv-name--strong") !== null;
                });
                
                if (items.length > 0) {
                    let activeIndex = items.findIndex(item => 
                        item.classList.contains("is-active") || 
                        (item.style.backgroundColor && item.style.backgroundColor !== "transparent" && item.style.backgroundColor !== "")
                    );
                    
                    if (e.shiftKey) {
                        activeIndex = (activeIndex <= 0) ? items.length - 1 : activeIndex - 1;
                    } else {
                        activeIndex = (activeIndex === -1 || activeIndex === items.length - 1) ? 0 : activeIndex + 1;
                    }
                    
                    let targetItem = items[activeIndex];
                    if (targetItem) {
                        targetItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
                        targetItem.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
                        targetItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                    }
                }
            } else if (e.shiftKey) {
                // Open LianChat when closed
                let lianFab = document.getElementById("floatingMessageButton");
                if (lianFab) {
                    let targetBtn = lianFab.querySelector('.lc-theme-dial') || lianFab.querySelector("button") || lianFab;
                    let events = ["pointerdown", "mousedown", "pointerup", "mouseup", "click"];
                    events.forEach(type => {
                        targetBtn.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
                    });
                }
            }
        }
    }, true);

    // Alt + Number (1-0) to whisper characters in room based on position
    document.addEventListener("keydown", (e) => {
        if (e.altKey && e.key >= '0' && e.key <= '9') {
            if (typeof window.ChatRoomCharacter !== "undefined" && Array.isArray(window.ChatRoomCharacter)) {
                let myNumber = (typeof Player !== "undefined" && Player.MemberNumber) ? Player.MemberNumber : -1;
                let otherChars = window.ChatRoomCharacter.filter(c => c.MemberNumber !== myNumber);
                
                let index = parseInt(e.key) - 1;
                if (e.key === '0') index = 9;
                
                if (index >= 0 && index < otherChars.length) {
                    let target = otherChars[index];
                    if (target && target.MemberNumber) {
                        e.preventDefault();
                        
                        // Toggle whisper target
                        if (window.ChatRoomTargetMemberNumber == target.MemberNumber) {
                            // Vanilla BC uses null, but BCX/ULTRAbc uses -1 for "Talk to everyone"
                            if (typeof window.BCX_Loaded !== "undefined" || window.ChatRoomTargetMemberNumber === -1) {
                                window.ChatRoomTargetMemberNumber = -1;
                            } else {
                                window.ChatRoomTargetMemberNumber = null;
                            }
                        } else {
                            window.ChatRoomTargetMemberNumber = target.MemberNumber;
                        }
                        
                        let chatInput = document.getElementById("InputChat");
                        if (chatInput) chatInput.focus();
                    }
                }
            }
        }
    }, true);

    // Alt + C (Ear) and Alt + V (Tail) shortcuts for BCAR+
    document.addEventListener("keydown", (e) => {
        if (e.altKey && !e.shiftKey && !e.ctrlKey) {
            if (e.code === 'KeyC' || e.code === 'KeyV') {
                if (typeof CurrentScreen !== "undefined" && CurrentScreen === "ChatRoom" && typeof ChatRoomClick === "function") {
                    if (typeof Player !== "undefined" && Player) {
                        e.preventDefault();
                        
                        let type = e.code === 'KeyC' ? 'ear' : 'tail';
                        
                        // Default to lowerleft jika object bcarSettings belum/gagal dimuat
                        let btnPos = "lowerleft"; 
                        if (Player.BCAR && Player.BCAR.bcarSettings && Player.BCAR.bcarSettings.animationButtonsPosition) {
                            btnPos = Player.BCAR.bcarSettings.animationButtonsPosition;
                        }
                        
                        let originalX = typeof MouseX !== "undefined" ? MouseX : 0;
                        let originalY = typeof MouseY !== "undefined" ? MouseY : 0;
                        
                        if (btnPos === "lowerleft") {
                            MouseX = 22;
                            MouseY = (type === 'ear') ? 882 : 937; // Diset ke 937 agar aman di tengah tombol tail
                        } else if (btnPos === "lowerright") {
                            MouseX = 980;
                            MouseY = (type === 'ear') ? 882 : 937;
                        } else if (btnPos === "upperleft") {
                            MouseX = 22;
                            MouseY = (type === 'ear') ? 157 : 202;
                        } else {
                            // Jika posisi lain, kita fallback ke click standar di kiri bawah
                            MouseX = 22;
                            MouseY = (type === 'ear') ? 882 : 937;
                        }
                        
                        ChatRoomClick();
                        
                        MouseX = originalX;
                        MouseY = originalY;
                    }
                }
            }
        }
    }, true);

    // Ctrl + Space untuk scroll chat ke paling bawah (Diganti dari Alt+Space agar tidak buka menu Windows)
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && !e.shiftKey && !e.altKey && e.code === "Space") {
            if (typeof CurrentScreen !== "undefined" && CurrentScreen === "ChatRoom") {
                let chatLog = document.getElementById("TextAreaChatLog");
                if (chatLog) {
                    e.preventDefault();
                    chatLog.scrollTop = chatLog.scrollHeight;
                }
            }
        }
    }, true);
})();
