setInterval(() => {
    try {
        if (
            typeof Player !== "undefined" &&
            Player &&
            Player.ImmersionSettings
        ) {
            if (!Player.ImmersionSettings.ShowUngarbledMessages) {
                Player.ImmersionSettings.ShowUngarbledMessages = true;

                // If the preference screen happens to be open, update the checkbox visually
                let cb = document.getElementById(
                    "preference-immersion-ShowUngarbledMessages",
                );
                if (cb && !cb.checked) {
                    cb.checked = true;
                }
            }
        }
    } catch (e) {}
}, 2000);
