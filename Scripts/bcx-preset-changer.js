(function () {
    "use strict";
    if (window !== window.top) return;

    let initInterval = setInterval(() => {
        if (typeof PreferenceRun === "function" && typeof PreferenceClick === "function" && typeof LZString !== "undefined") {
            clearInterval(initInterval);
            initUI();
        }
    }, 2000);

    let presetMap = { 0: "Dominant", 1: "Switch", 2: "Submissive", 3: "Slave" };

    function changePreset(presetId) {
        if (typeof Player === "undefined" || !Player.ExtensionSettings || !Player.ExtensionSettings.BCX) {
            alert("Data BCX tidak ditemukan! Pastikan BCX sedang aktif.");
            return;
        }
        try {
            let saved = Player.ExtensionSettings.BCX;
            let parsed = JSON.parse(LZString.decompressFromBase64(saved));
            
            parsed.preset = presetId;
            Player.ExtensionSettings.BCX = LZString.compressToBase64(JSON.stringify(parsed));
            
            if (typeof ServerPlayerExtensionSettingsSync === "function") {
                ServerPlayerExtensionSettingsSync("BCX");
            }
            alert("Berhasil! Preset BCX diubah menjadi " + presetMap[presetId] + ".\n\nHarap REFRESH halaman (F5) sekarang agar efeknya langsung terasa.");
        } catch (e) {
            console.error(e);
            alert("Gagal mengubah preset: " + e.message);
        }
    }

    function initUI() {
        const origPreferenceRun = window.PreferenceRun;
        window.PreferenceRun = function () {
            origPreferenceRun.apply(this, arguments);

            // Munculkan tombol di layar Preference utama
            if (window.PreferenceSubscreen === "") {
                // Taruh tombol di ujung kanan bawah agar tidak tumpang tindih
                DrawButton(1650, 820, 300, 90, "BCX Preset", "White", "", "Change BCX Preset");
            } 
            else if (window.PreferenceSubscreen === "BCXPresetChangerUI") {
                // Gambar menu kustom kita
                DrawText("=== PENGATURAN PRESET BCX ===", 1000, 150, "Black", "Gray");
                DrawText("Ubah preset tanpa perlu melakukan reset ulang data BCX.", 1000, 220, "Black", "Gray");

                // Ambil dan tampilkan preset saat ini
                let currentPresetName = "Unknown";
                if (typeof Player !== "undefined" && Player.ExtensionSettings && Player.ExtensionSettings.BCX) {
                    try {
                        let p = JSON.parse(LZString.decompressFromBase64(Player.ExtensionSettings.BCX));
                        if (presetMap[p.preset] !== undefined) currentPresetName = presetMap[p.preset];
                    } catch (e) {}
                }
                DrawText("Preset Kamu Saat Ini: " + currentPresetName.toUpperCase(), 1000, 300, "DarkBlue", "Gray");

                // Tombol-tombol pilihan Preset
                DrawButton(500, 400, 400, 90, "Dominant", "White", "");
                DrawButton(1100, 400, 400, 90, "Switch", "White", "");
                DrawButton(500, 550, 400, 90, "Submissive", "White", "");
                DrawButton(1100, 550, 400, 90, "Slave", "White", "");

                // Tombol kembali (Exit)
                DrawButton(1815, 75, 90, 90, "", "White", "Icons/Exit.png", "Kembali");
            }
        };

        const origPreferenceClick = window.PreferenceClick;
        window.PreferenceClick = function () {
            if (window.PreferenceSubscreen === "") {
                if (MouseIn(1650, 820, 300, 90)) {
                    window.PreferenceSubscreen = "BCXPresetChangerUI";
                    return; // Hentikan klik asli game
                }
            } 
            else if (window.PreferenceSubscreen === "BCXPresetChangerUI") {
                if (MouseIn(1815, 75, 90, 90)) {
                    window.PreferenceSubscreen = "";
                    return;
                }
                if (MouseIn(500, 400, 400, 90)) changePreset(0);
                if (MouseIn(1100, 400, 400, 90)) changePreset(1);
                if (MouseIn(500, 550, 400, 90)) changePreset(2);
                if (MouseIn(1100, 550, 400, 90)) changePreset(3);
                
                return; // Jangan teruskan klik ke sistem game asli kalau di layar ini
            }

            origPreferenceClick.apply(this, arguments);
        };
    }
})();
