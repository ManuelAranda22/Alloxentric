const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('main-content');
const historyButton = document.getElementById('history-button');
const historyPanel = document.getElementById('history-panel');
const textInput = document.getElementById('text-input');
const sendButton = document.getElementById('send-button');

async function sendTextToBackend(text) {
    try {
        const response = await fetch('/generate_audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text }),
        });
        
        const result = await response.json();
        if (result.success) {
            console.log('Audio generado:', result.message);
        } else {
            console.error('Error al generar audio:', result.error);
        }
    } catch (error) {
        console.error('Error al enviar texto al backend:', error);
    }
}

document.getElementById('send-button').addEventListener('click', () => {
    const text = document.getElementById('text-input').value.trim();
    if (text) {
        sendTextToBackend(text);
        document.getElementById('text-input').value = '';
    }
});

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('retracted');
    mainContent.classList.toggle('expanded');
});

historyButton.addEventListener('click', () => {
    historyPanel.classList.toggle('open');
});

document.addEventListener('click', (event) => {
    if (!historyPanel.contains(event.target) && event.target !== historyButton) {
        historyPanel.classList.remove('open');
    }
});


let lastAudioFilename = '';
let lastMappingFilename = '';
let isPlaying = false;

async function fetchLatestFile() {
    try {
        const response = await fetch('/public/ultimo_archivo.txt?timestamp=' + Date.now());
        const data = await response.text();
        const [newAudioFilename, newMappingFilename] = data.trim().split('\n');

        if (newAudioFilename !== lastAudioFilename || newMappingFilename !== lastMappingFilename) {
            lastAudioFilename = newAudioFilename;
            lastMappingFilename = newMappingFilename;
            return { audio: newAudioFilename, mapping: newMappingFilename };
        }
    } catch (error) {
        console.error('Error al obtener el archivo más reciente:', error);
    }
    return null;
}

async function fetchMappingAndPlay(audioFilename, mappingFilename) {
    try {
        const audioElement = document.getElementById('audio');
        audioElement.src = audioFilename; 
        audioElement.onended = () => {
            document.getElementById('avatar').src = 'public/frames/X.jpg';
        };

        const response = await fetch(mappingFilename);
        const mappingData = await response.json();

        if (mappingData && Array.isArray(mappingData.mouthCues)) {
            isPlaying = true;

            audioElement.onplay = () => {
                mappingData.mouthCues.forEach(cue => {
                    if (cue && cue.value && cue.start != null) {
                        setTimeout(() => {
                            const frame = `public/frames/${cue.value}.jpg`;
                            document.getElementById('avatar').src = frame;
                        }, cue.start * 1000);
                    } else {
                        console.error('Datos de cue inválidos:', cue);
                    }
                });
            };

            audioElement.play();
            audioElement.onended = () => {
                document.getElementById('avatar').src = 'public/frames/X.jpg';
                isPlaying = false;
            };

        } else {
            console.error('Datos de mapeo inválidos o mal formateados:', mappingData);
        }
    } catch (error) {
        console.error('Error al cargar el mapeo o reproducir el audio:', error);
        isPlaying = false;
    }
}

document.getElementById('interact-button').addEventListener('click', () => {
    checkForNewAudio();
    document.getElementById('interact-button').style.display = 'none';
});

async function checkForNewAudio() {
    const latestFiles = await fetchLatestFile();
    if (latestFiles) {
        await fetchMappingAndPlay(latestFiles.audio, latestFiles.mapping);
    }
    setTimeout(checkForNewAudio, 2000); // Revisar cada 2 segundos
}


window.onload = checkForNewAudio;
