(function () {
    "use strict";
    if (window !== window.top) return;

    function initGoogleTranslate() {
        if (document.getElementById("bc-google-translate-btn")) return;

        const btn = document.createElement("button");
        btn.id = "bc-google-translate-btn";
        btn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"></path><path d="M4 14l6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="M22 22l-5-10-5 10"></path><path d="M14 18h6"></path></svg>`;
        btn.style.position = "fixed";
        btn.style.top = "10px";
        btn.style.left = "10px";
        btn.style.zIndex = "999999";
        btn.style.padding = "10px";
        btn.style.backgroundColor = "#4285f4";
        btn.style.color = "#ffffff";
        btn.style.border = "none";
        btn.style.borderRadius = "50%";
        btn.style.cursor = "move";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.justifyContent = "center";
        btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
        btn.style.userSelect = "none";

        btn.onmouseover = () => (btn.style.backgroundColor = "#3367d6");
        btn.onmouseout = () => (btn.style.backgroundColor = "#4285f4");

        const popup = document.createElement("div");
        popup.id = "bc-google-translate-popup";
        popup.style.position = "fixed";
        popup.style.top = "50px";
        popup.style.left = "50px";
        popup.style.width = "350px";
        popup.style.height = "450px";
        popup.style.backgroundColor = "#ffffff";
        popup.style.border = "1px solid #ccc";
        popup.style.borderRadius = "8px";
        popup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
        popup.style.zIndex = "1000000";
        popup.style.display = "none";
        popup.style.flexDirection = "column";
        popup.style.overflow = "hidden";

        const header = document.createElement("div");
        header.style.backgroundColor = "#f1f3f4";
        header.style.padding = "8px 12px";
        header.style.cursor = "move";
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
        header.style.borderBottom = "1px solid #e0e0e0";
        header.style.fontFamily = "sans-serif";
        header.style.userSelect = "none";

        const title = document.createElement("span");
        title.innerText = "Google Translate";
        title.style.color = "#202124";
        title.style.fontWeight = "bold";
        title.style.fontSize = "14px";

        const closeBtn = document.createElement("span");
        closeBtn.innerText = "✖";
        closeBtn.style.color = "#5f6368";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.fontWeight = "bold";
        closeBtn.style.fontSize = "16px";

        closeBtn.onclick = () => (popup.style.display = "none");
        closeBtn.onmouseover = () => (closeBtn.style.color = "#d93025");
        closeBtn.onmouseout = () => (closeBtn.style.color = "#5f6368");

        header.appendChild(title);
        header.appendChild(closeBtn);

        const contentDiv = document.createElement("div");
        contentDiv.style.flex = "1";
        contentDiv.style.display = "flex";
        contentDiv.style.flexDirection = "column";
        contentDiv.style.padding = "10px";
        contentDiv.style.gap = "10px";
        contentDiv.style.backgroundColor = "#ffffff";

        const controls = document.createElement("div");
        controls.style.display = "flex";
        controls.style.gap = "10px";
        controls.style.alignItems = "center";

        const sourceLang = document.createElement("select");
        sourceLang.innerHTML =
            '<option value="auto">Otomatis</option><option value="en" selected>Inggris</option><option value="id">Indonesia</option><option value="ja">Jepang</option><option value="zh-CN">China</option><option value="ms">Melayu</option>';
        sourceLang.style.flex = "1";
        sourceLang.style.padding = "5px";
        sourceLang.style.borderRadius = "4px";
        sourceLang.style.border = "1px solid #ccc";

        const targetLang = document.createElement("select");
        targetLang.innerHTML =
            '<option value="id">Indonesia</option><option value="en">Inggris</option><option value="ja">Jepang</option><option value="zh-CN">China</option><option value="ms">Melayu</option>';
        targetLang.style.flex = "1";
        targetLang.style.padding = "5px";
        targetLang.style.borderRadius = "4px";
        targetLang.style.border = "1px solid #ccc";

        const arrow = document.createElement("span");
        arrow.innerText = "⇆";
        arrow.style.fontWeight = "bold";
        arrow.style.color = "#555";
        arrow.style.cursor = "pointer";
        arrow.style.userSelect = "none";
        arrow.onmouseover = () => (arrow.style.color = "#000");
        arrow.onmouseout = () => (arrow.style.color = "#555");
        arrow.onclick = () => {
            if (sourceLang.value !== "auto") {
                const temp = sourceLang.value;
                sourceLang.value = targetLang.value;
                targetLang.value = temp;
                if (inputArea.value.trim()) doTranslate();
            }
        };

        controls.appendChild(sourceLang);
        controls.appendChild(arrow);
        controls.appendChild(targetLang);

        const inputArea = document.createElement("textarea");
        inputArea.placeholder = "Ketik teks di sini...";
        inputArea.style.flex = "1";
        inputArea.style.resize = "none";
        inputArea.style.padding = "8px";
        inputArea.style.fontFamily = "sans-serif";
        inputArea.style.borderRadius = "4px";
        inputArea.style.border = "1px solid #ccc";

        const outputArea = document.createElement("textarea");
        outputArea.placeholder = "Hasil terjemahan...";
        outputArea.style.flex = "1";
        outputArea.style.resize = "none";
        outputArea.style.padding = "8px";
        outputArea.style.fontFamily = "sans-serif";
        outputArea.style.backgroundColor = "#f1f3f4";
        outputArea.style.borderRadius = "4px";
        outputArea.style.border = "1px solid #ccc";
        outputArea.readOnly = true;

        let debounceTimer;
        const doTranslate = async () => {
            const text = inputArea.value.trim();
            if (!text) {
                outputArea.value = "";
                correctionDiv.style.display = "none";
                return;
            }
            outputArea.value = "Menerjemahkan...";
            try {
                const sl = sourceLang.value;
                const tl = targetLang.value;
                const res = await fetch(
                    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&dt=sp&dt=qc&dt=rm&q=${encodeURIComponent(text)}`,
                );
                const data = await res.json();
                let translated = "";
                let sourceRomaji = "";
                let targetRomaji = "";
                if (data && data[0]) {
                    data[0].forEach((item) => {
                        if (item[0]) translated += item[0];
                        if (item[0] === null) {
                            if (item[2]) targetRomaji = item[2];
                            if (item[3]) sourceRomaji = item[3];
                        }
                    });
                }

                if (sourceRomaji || targetRomaji) {
                    translated += "\n";
                    if (sourceRomaji)
                        translated += "\n[Asli: " + sourceRomaji + "]";
                    if (targetRomaji)
                        translated += "\n[Hasil: " + targetRomaji + "]";
                }
                let spellCorrection = null;
                if (data && data[7] && data[7][1]) {
                    spellCorrection = data[7][1];
                }

                if (spellCorrection) {
                    correctionDiv.style.display = "block";
                    correctionBtn.innerText = spellCorrection;
                } else {
                    correctionDiv.style.display = "none";
                }

                outputArea.value = translated;
            } catch (err) {
                outputArea.value =
                    "Error: Gagal menerjemahkan. Coba lagi nanti.";
            }
        };

        inputArea.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(doTranslate, 500);
        });
        sourceLang.addEventListener("change", doTranslate);
        targetLang.addEventListener("change", doTranslate);

        contentDiv.appendChild(controls);
        const correctionDiv = document.createElement("div");
        correctionDiv.style.display = "none";
        correctionDiv.style.fontSize = "13px";
        correctionDiv.style.color = "#d93025";
        correctionDiv.style.fontFamily = "sans-serif";

        const correctionText = document.createElement("span");
        correctionText.innerText = "Maksud Anda: ";

        const correctionBtn = document.createElement("span");
        correctionBtn.style.fontWeight = "bold";
        correctionBtn.style.cursor = "pointer";
        correctionBtn.style.textDecoration = "underline";

        correctionBtn.onclick = () => {
            inputArea.value = correctionBtn.innerText;
            doTranslate();
        };

        correctionDiv.appendChild(correctionText);
        correctionDiv.appendChild(correctionBtn);

        contentDiv.appendChild(inputArea);
        contentDiv.appendChild(correctionDiv);
        contentDiv.appendChild(outputArea);

        popup.appendChild(header);
        popup.appendChild(contentDiv);

        document.body.appendChild(btn);
        document.body.appendChild(popup);

        let btnDragging = false;
        let btnMoved = false;
        let popupDragging = false;
        let startX, startY;
        let btnInitX, btnInitY, popupInitX, popupInitY;

        const onMouseMove = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (btnDragging) {
                if (Math.abs(dx) > 3 || Math.abs(dy) > 3) btnMoved = true;
            }

            btn.style.left = `${btnInitX + dx}px`;
            btn.style.top = `${btnInitY + dy}px`;
            btn.style.bottom = "auto";
            btn.style.right = "auto";

            popup.style.left = `${popupInitX + dx}px`;
            popup.style.top = `${popupInitY + dy}px`;
            popup.style.bottom = "auto";
            popup.style.right = "auto";
        };

        const onMouseUp = () => {
            btnDragging = false;
            popupDragging = false;
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        btn.onmousedown = (e) => {
            btnDragging = true;
            btnMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            
            btnInitX = parseInt(btn.style.left, 10) || 0;
            btnInitY = parseInt(btn.style.top, 10) || 0;
            popupInitX = parseInt(popup.style.left, 10) || 0;
            popupInitY = parseInt(popup.style.top, 10) || 0;

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        };

        header.onmousedown = (e) => {
            if (e.target === closeBtn) return;
            popupDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            
            btnInitX = parseInt(btn.style.left, 10) || 0;
            btnInitY = parseInt(btn.style.top, 10) || 0;
            popupInitX = parseInt(popup.style.left, 10) || 0;
            popupInitY = parseInt(popup.style.top, 10) || 0;

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        };

        btn.onclick = (e) => {
            if (btnMoved) {
                e.preventDefault();
                return;
            }
            if (popup.style.display === "none") {
                popup.style.display = "flex";
                inputArea.focus();
            } else {
                popup.style.display = "none";
            }
        };

        window.addEventListener("keydown", (e) => {
            if ((e.key === "Escape" || e.keyCode === 27) && popup.style.display !== "none") {
                popup.style.display = "none";
                e.stopPropagation();
            }
        }, true);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initGoogleTranslate);
    } else {
        initGoogleTranslate();
    }
})();
