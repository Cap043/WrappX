document.addEventListener('DOMContentLoaded', function () {
    const websiteLink = sessionStorage.getItem('websiteLink');
    if (!websiteLink) {
        alert('Invalid access. Please go back to the first page.');
        window.location.href = '/';
    }
});

function generateApp() {
    const appName = document.getElementById('appName').value;
    const packageName = document.getElementById('packageName').value || `com.example.${appName}`;
    const versionName = document.getElementById('versionName').value || '1.0.0';
    const versionCode = document.getElementById('versionCode').value || '1';

    // Collect selected platforms
    const selectedPlatforms = [];
    const androidCheckbox = document.getElementById('androidPlatform');
    const iosCheckbox = document.getElementById('iosPlatform');

    if (androidCheckbox.checked) {
        selectedPlatforms.push('android');
    }

    if (iosCheckbox.checked) {
        selectedPlatforms.push('ios');
    }

    // Get the user-uploaded logo file
    const logoFileInput = document.getElementById('appIcon');
    const logoFile = logoFileInput.files[0];

    // Create a FormData object to send the logo file
    const formData = new FormData();
    formData.append('logo', logoFile, logoFile.name);

    // Send a request to your server to upload the logo file
    fetch('/upload-logo', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Logo uploaded successfully, proceed with app generation
            const logoFileName = data.fileName;

            // Send another request to generate the app with customization values and logo file name
            fetch('/generate-app', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    websiteLink: sessionStorage.getItem('websiteLink'),
                    appName,
                    packageName,
                    versionName,
                    versionCode,
                    platforms: selectedPlatforms,
                    logoFileName,
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);

                    // Show the download link
                    document.getElementById('downloadLink').style.display = 'block';

                    // Set the download link href
                    document.getElementById('appDownloadLink').href = `/download/${data.token}`;
                } else {
                    alert('Error generating app.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error generating app.');
            });
        } else {
            alert('Error uploading logo.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error uploading logo.');
    });
}

function generateToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
