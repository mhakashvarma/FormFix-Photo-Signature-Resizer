// FormFix - stable, consolidated application script
// All DOM elements are initialized before event handlers are registered.

"use strict";

// ---------- DOM elements ----------
const photoInput = document.getElementById("photoInput");
const signatureInput = document.getElementById("signatureInput");

const photoCanvas = document.getElementById("photoCanvas");
const signatureCanvas = document.getElementById("signatureCanvas");
const cropPreviewCanvas = document.getElementById("cropPreviewCanvas");

const photoStatus = document.getElementById("photoStatus");
const signatureStatus = document.getElementById("signatureStatus");

const presetSelect = document.getElementById("preset");
const dimensionsText = document.getElementById("dimensions");
const fileLimitText = document.getElementById("fileLimit");
const signatureFileLimitText = document.getElementById("signatureFileLimit");
const presetNote = document.getElementById("presetNote");
const customFields = document.getElementById("customFields");

const customWidth = document.getElementById("customWidth");
const customHeight = document.getElementById("customHeight");
const customLimit = document.getElementById("customLimit");
const signatureWidthInput = document.getElementById("signatureWidth");
const signatureHeightInput = document.getElementById("signatureHeight");
const signatureLimitInput = document.getElementById("signatureLimit");
const applyCustom = document.getElementById("applyCustom");

const cropZoom = document.getElementById("cropZoom");
const cropPosition = document.getElementById("cropPosition");

const processPhotoButton = document.getElementById("processPhoto");
const processSignatureButton = document.getElementById("processSignature");
const downloadArea = document.getElementById("downloadArea");

const requiredElements = [
    photoInput, signatureInput, photoCanvas, signatureCanvas,
    cropPreviewCanvas, photoStatus, signatureStatus, presetSelect,
    dimensionsText, fileLimitText, signatureFileLimitText, customFields,
    customWidth, customHeight, customLimit, signatureWidthInput,
    signatureHeightInput, signatureLimitInput, applyCustom,
    cropZoom, cropPosition, processPhotoButton,
    processSignatureButton, downloadArea
];

if (requiredElements.some(element => !element)) {
    console.error("FormFix setup error: one or more required HTML elements are missing.");
    alert("FormFix could not start because an HTML element is missing. Please use the matching index.html and script.js files.");
    throw new Error("FormFix HTML/JavaScript mismatch.");
}

// ---------- Application state ----------
let uploadedPhoto = null;
let originalPhotoImage = null;
let uploadedSignature = null;
let processedPhotoBlob = null;
let processedSignatureBlob = null;

let photoDownloadUrl = null;
let signatureDownloadUrl = null;

let currentPreset = {
    width: 3.5,
    height: 3.5,
    minLimit: 20,
    limit: 300,
    note: "Square crop guide. Confirm the current UPSC notice for the exact photo rules."
};

let currentSignaturePreset = {
    width: 4,
    height: 2,
    minLimit: 20,
    limit: 300
};

// These are reference profiles. Crop dimensions are working crop ratios,
// not official physical dimensions unless the current notice says so.
const presets = {
    upsc: {
        width: 3.5,
        height: 3.5,
        minLimit: 20,
        limit: 300,
        note: "Square crop guide. UPSC photo pixel rules are stated in its current instructions; verify the latest notice.",
        signature: { width: 4, height: 2, minLimit: 20, limit: 300 }
    },
    ugc: {
        width: 3.5,
        height: 4.5,
        minLimit: 10,
        limit: 200,
        note: "Portrait crop is a working default. Verify the current UGC-NET bulletin for dimensions and file rules.",
        signature: { width: 4, height: 2, minLimit: 4, limit: 30 }
    },
    csir: {
        width: 3.5,
        height: 4.5,
        minLimit: 10,
        limit: 200,
        note: "Portrait crop is a working default. Verify the current CSIR-NET bulletin for dimensions and file rules.",
        signature: { width: 4, height: 2, minLimit: 4, limit: 30 }
    }
};

// ---------- Small helpers ----------
function revokeUrl(url) {
    if (url) URL.revokeObjectURL(url);
}

function setPresetDisplay() {
    dimensionsText.textContent = `${currentPreset.width} × ${currentPreset.height} cm (crop guide)`;
    fileLimitText.textContent = `${currentPreset.minLimit}–${currentPreset.limit} KB`;
    signatureFileLimitText.textContent =
        `${currentSignaturePreset.minLimit}–${currentSignaturePreset.limit} KB`;
    presetNote.textContent = currentPreset.note || "Custom crop settings.";
}

function updatePhotoPreviewCanvas(file, canvas, statusElement, type) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        return;
    }

    const image = new Image();
    const imageUrl = URL.createObjectURL(file);

    image.onload = () => {
        const maxWidth = 400;
        const maxHeight = 400;
        const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        canvas.style.display = "block";

        statusElement.textContent =
            `${file.name} | ${image.width} × ${image.height} px`;

        if (type === "photo") {
            originalPhotoImage = image;
            drawCropPreview();
        }

        URL.revokeObjectURL(imageUrl);
    };

    image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        alert("Unable to open this image. Please try another file.");
    };

    image.src = imageUrl;
}

// ---------- Crop preview ----------
function getCropRectangle() {
    if (!originalPhotoImage) return null;

    const imageWidth = originalPhotoImage.naturalWidth || originalPhotoImage.width;
    const imageHeight = originalPhotoImage.naturalHeight || originalPhotoImage.height;
    const targetRatio = currentPreset.width / currentPreset.height;

    let cropWidth = imageWidth;
    let cropHeight = imageWidth / targetRatio;

    if (cropHeight > imageHeight) {
        cropHeight = imageHeight;
        cropWidth = imageHeight * targetRatio;
    }

    const zoom = Number(cropZoom.value) || 1;
    cropWidth /= zoom;
    cropHeight /= zoom;

    const maxX = Math.max(0, imageWidth - cropWidth);
    const maxY = Math.max(0, imageHeight - cropHeight);
    const verticalPosition = (Number(cropPosition.value) + 100) / 200;

    return {
        x: maxX / 2,
        y: maxY * verticalPosition,
        width: cropWidth,
        height: cropHeight
    };
}

function drawCropPreview() {
    if (!originalPhotoImage) return;

    const crop = getCropRectangle();
    if (!crop) return;

    const previewWidth = 300;
    const previewHeight = Math.max(
        1,
        Math.round(previewWidth * currentPreset.height / currentPreset.width)
    );

    cropPreviewCanvas.width = previewWidth;
    cropPreviewCanvas.height = previewHeight;

    const context = cropPreviewCanvas.getContext("2d");
    context.clearRect(0, 0, previewWidth, previewHeight);
    context.drawImage(
        originalPhotoImage,
        crop.x, crop.y, crop.width, crop.height,
        0, 0, previewWidth, previewHeight
    );

    // Face-position guide only; this is not automatic face detection.
    context.save();
    context.strokeStyle = "#FFFFFF";
    context.lineWidth = 3;
    context.setLineDash([8, 5]);
    context.beginPath();
    context.ellipse(
        previewWidth / 2,
        previewHeight * 0.40,
        previewWidth * 0.27,
        previewHeight * 0.29,
        0, 0, Math.PI * 2
    );
    context.stroke();
    context.restore();
}

// ---------- Image compression ----------
function compressImage(canvas, targetBytes) {
    return new Promise(resolve => {
        let low = 0.05;
        let high = 0.95;
        let bestBlob = null;

        async function search() {
            for (let attempt = 0; attempt < 10; attempt++) {
                const quality = (low + high) / 2;
                const blob = await new Promise(resolveBlob => {
                    canvas.toBlob(resolveBlob, "image/jpeg", quality);
                });

                if (!blob) {
                    resolve(null);
                    return;
                }

                if (blob.size <= targetBytes) {
                    bestBlob = blob;
                    low = quality;
                } else {
                    high = quality;
                }
            }
            resolve(bestBlob);
        }

        search().catch(() => resolve(null));
    });
}

function makeDownloadCard(title, blob, fileName, width, height, minKB, maxKB, kind) {
    const sizeKB = blob.size / 1024;
    const withinMinimum = sizeKB >= minKB;
    const withinMaximum = sizeKB <= maxKB;

    const oldUrl = kind === "photo" ? photoDownloadUrl : signatureDownloadUrl;
    revokeUrl(oldUrl);

    const url = URL.createObjectURL(blob);
    if (kind === "photo") photoDownloadUrl = url;
    else signatureDownloadUrl = url;

    const statusText = withinMaximum
        ? (withinMinimum ? "Within the configured size range" : "Below the configured minimum; verify the form rule")
        : "Above the configured maximum";

    return `
        <div class="download-result">
            <h3>✓ ${title} ready</h3>
            <p>Dimensions: ${width} × ${height} pixels</p>
            <p>File size: ${sizeKB.toFixed(2)} KB</p>
            <p>Configured range: ${minKB}–${maxKB} KB</p>
            <p>Status: ${statusText}</p>
            ${withinMaximum
                ? `<a href="${url}" download="${fileName}">Download ${title}</a>`
                : `<p>Please adjust the image and process it again.</p>`}
        </div>
    `;
}

// ---------- Presets ----------
function applyPreset(preset, signaturePreset) {
    currentPreset = { ...preset };
    currentSignaturePreset = { ...signaturePreset };
    setPresetDisplay();
    drawCropPreview();
}

presetSelect.addEventListener("change", function () {
    const selected = this.value;

    if (selected === "custom") {
        customFields.classList.remove("hidden");
        return;
    }

    customFields.classList.add("hidden");

    if (!presets[selected]) {
        alert("Unknown preset. Please choose a valid preset.");
        return;
    }

    applyPreset(presets[selected], presets[selected].signature);
});

applyCustom.addEventListener("click", function (event) {
    event.preventDefault();

    const values = [
        Number(customWidth.value),
        Number(customHeight.value),
        Number(customLimit.value),
        Number(signatureWidthInput.value),
        Number(signatureHeightInput.value),
        Number(signatureLimitInput.value)
    ];

    if (!values.every(value => Number.isFinite(value) && value > 0)) {
        alert("Please enter valid positive values in all custom fields.");
        return;
    }

    const [width, height, limit, sigWidth, sigHeight, sigLimit] = values;

    currentPreset = {
        width,
        height,
        minLimit: 1,
        limit,
        note: "Custom photo crop and file-size settings."
    };

    currentSignaturePreset = {
        width: sigWidth,
        height: sigHeight,
        minLimit: 1,
        limit: sigLimit
    };

    setPresetDisplay();
    drawCropPreview();
    alert("Custom photo and signature settings applied!");
});

// ---------- Upload handlers ----------
photoInput.addEventListener("change", function () {
    const file = this.files && this.files[0];
    if (!file) return;

    uploadedPhoto = file;
    updatePhotoPreviewCanvas(file, photoCanvas, photoStatus, "photo");
});

signatureInput.addEventListener("change", function () {
    const file = this.files && this.files[0];
    if (!file) return;

    uploadedSignature = file;
    updatePhotoPreviewCanvas(file, signatureCanvas, signatureStatus, "signature");
});

// ---------- Crop control handlers ----------
cropZoom.addEventListener("input", drawCropPreview);
cropPosition.addEventListener("input", drawCropPreview);

// ---------- Process photo ----------
processPhotoButton.addEventListener("click", async function () {
    if (!originalPhotoImage || !uploadedPhoto) {
        alert("Please upload a photo first.");
        return;
    }

    const crop = getCropRectangle();
    if (!crop) {
        alert("Unable to calculate the crop. Please upload the photo again.");
        return;
    }

    const outputWidth = Math.round(currentPreset.width / 2.54 * 300);
    const outputHeight = Math.round(currentPreset.height / 2.54 * 300);

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = outputWidth;
    outputCanvas.height = outputHeight;

    const context = outputCanvas.getContext("2d");
    context.drawImage(
        originalPhotoImage,
        crop.x, crop.y, crop.width, crop.height,
        0, 0, outputWidth, outputHeight
    );

    processPhotoButton.disabled = true;
    processPhotoButton.textContent = "Compressing...";

    try {
        const maxBytes = Math.floor(currentPreset.limit * 1024 * 0.98);
        const blob = await compressImage(outputCanvas, maxBytes);

        if (!blob) {
            alert("Could not generate the compressed photo. Please try another image.");
            return;
        }

        processedPhotoBlob = blob;
        const card = makeDownloadCard(
            "Photo", blob, "formfix-photo.jpg",
            outputWidth, outputHeight,
            currentPreset.minLimit, currentPreset.limit, "photo"
        );

        downloadArea.innerHTML = card;
    } catch (error) {
        console.error("Photo processing error:", error);
        alert("Photo processing failed. Please try again.");
    } finally {
        processPhotoButton.disabled = false;
        processPhotoButton.textContent = "Process Photo";
    }
});

// ---------- Process signature ----------
processSignatureButton.addEventListener("click", async function () {
    if (!uploadedSignature) {
        alert("Please upload a signature first.");
        return;
    }

    processSignatureButton.disabled = true;
    processSignatureButton.textContent = "Processing...";

    const imageUrl = URL.createObjectURL(uploadedSignature);
    const signatureImage = new Image();

    signatureImage.onload = async () => {
        try {
            const outputWidth = Math.round(currentSignaturePreset.width / 2.54 * 300);
            const outputHeight = Math.round(currentSignaturePreset.height / 2.54 * 300);

            const canvas = document.createElement("canvas");
            canvas.width = outputWidth;
            canvas.height = outputHeight;

            const context = canvas.getContext("2d");
            context.fillStyle = "#FFFFFF";
            context.fillRect(0, 0, outputWidth, outputHeight);

            const scale = Math.min(
                outputWidth / signatureImage.width,
                outputHeight / signatureImage.height
            );

            const width = signatureImage.width * scale;
            const height = signatureImage.height * scale;
            const x = (outputWidth - width) / 2;
            const y = (outputHeight - height) / 2;

            context.drawImage(signatureImage, x, y, width, height);

            const maxBytes = Math.floor(currentSignaturePreset.limit * 1024 * 0.98);
            const blob = await compressImage(canvas, maxBytes);

            if (!blob) {
                alert("Could not generate the compressed signature. Please try another image.");
                return;
            }

            processedSignatureBlob = blob;

            const card = makeDownloadCard(
                "Signature", blob, "formfix-signature.jpg",
                outputWidth, outputHeight,
                currentSignaturePreset.minLimit,
                currentSignaturePreset.limit,
                "signature"
            );

            downloadArea.insertAdjacentHTML("beforeend", card);
        } catch (error) {
            console.error("Signature processing error:", error);
            alert("Signature processing failed. Please try again.");
        } finally {
            URL.revokeObjectURL(imageUrl);
            processSignatureButton.disabled = false;
            processSignatureButton.textContent = "Process Signature";
        }
    };

    signatureImage.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        processSignatureButton.disabled = false;
        processSignatureButton.textContent = "Process Signature";
        alert("Unable to load the signature image.");
    };

    signatureImage.src = imageUrl;
});

// ---------- Initial setup ----------
applyPreset(presets.upsc, presets.upsc.signature);
customFields.classList.add("hidden");
