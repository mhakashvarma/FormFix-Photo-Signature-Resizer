
# FormFix – Photo & Signature Resizer

FormFix is an offline web application that helps users prepare photographs and signatures for online application forms.

Users can upload images, select application presets, crop photographs, resize images, compress files and download the processed results.

## Features

- Photo and signature upload
- Live image preview
- Application presets: UPSC, UGC-NET and CSIR-UGC NET
- Custom photo and signature dimensions
- Adjustable photo crop and face-position guide
- Zoom and vertical positioning controls
- Automatic JPEG compression
- Separate photo and signature downloads
- File-size and image-dimension information
- Offline functionality

## Technologies Used

- HTML5
- CSS3
- JavaScript
- HTML Canvas API
- Browser File API
- JavaScript Blob API

## Project Structure

```text
Project-2-Form-Photo-Fixer/
│
├── index.html
├── style.css
├── script.js
├── README.md
├── prompts.md
└── screenshots/
```

## How to Run

1. Download or clone this repository.
2. Open the project folder in Visual Studio Code.
3. Open index.html using Live Server.
4. Upload a photograph or signature.
5. Select an application preset or configure custom settings.
6. Adjust the crop and process the image.
7. Download the generated files.

## Application Presets

- UPSC
- UGC-NET
- CSIR-UGC NET
- Custom Preset

Preset values are reference configurations. Users should verify the latest official application notification before submitting their images.

## Offline Support

FormFix uses browser-based JavaScript and Canvas processing. Image uploads, cropping, compression and downloads work locally without requiring a backend or external API.

## Privacy

Images are processed locally in the browser and are not intentionally uploaded to a server.

## Limitations

- Face positioning uses a visual guide, not automatic face detection.
- Compression may not achieve every requested file-size range.
- Official application specifications can change.
- Final image requirements should always be checked against the relevant notification.

## Developer

Created as part of the Week 2 GenAI Internship Project.

## License

This project is intended for educational purposes.
```
