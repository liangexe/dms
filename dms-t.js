const voiceBtn = document.getElementById('voice-btn');
const conversationLog = document.getElementById('conversation-log');
const recognitionStatus = document.getElementById('recognition-status');
const hudGraphic = document.querySelector('.status-graphic')
const stateIcon = document.querySelector('.state-icon')
const inputSec = document.querySelector('.input-section')
const cvrSec = document.querySelector('.conversation-section')
let NeResponse = false;
let scenarioDiv;
let lastSpeechTime = 0;
let speechQueue = [];
let isSpeaking = false;
let cleanupCounter = 0;
const scenarioSteps = [
    '헤이 현',
    '주차하는데 네 도움이 필요해',
    '맞아 또는 아니야',
    '배터리 교체했어',
    '괜찮아',
    '별로 없어',
    '그래',
    '저기까지 가볼게',
    '응 알았어',
    '모서리랑 뒷바퀴랑 만나',
    '좋아',
    '알겠어',
    '어 해볼게',
    '오케이',
    '지금?',
    '확인했어',
    '괜찮은 것 같아',
    '고마워'
];
let currentScenarioStep = 0;

function updateScenarioDisplay() {
    const scenarioText = document.getElementById('scenario-text');
    if (scenarioText && currentScenarioStep < scenarioSteps.length) {
        scenarioText.textContent = scenarioSteps[currentScenarioStep];
        if (scenarioDiv) {
            scenarioDiv.style.display = 'flex';
        }
    } else if (scenarioDiv) {
        scenarioDiv.style.display = 'none';
    }
}

function updateTime() {
    const now = new Date();

    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const day = dayNames[now.getDay()];

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const isAM = hours < 12;

    const ampm = isAM ? 'AM' : 'PM';
    hours = hours % 12 || 12;
    const hourStr = String(hours).padStart(2, '0');

    const timeText = `${month}월 ${date}일 (${day}) ${hourStr}:${minutes} ${ampm}`;

    const timeDisplay = document.getElementById('time');

    const timeParts = timeText.replace(
        /(\d{2}:\d{2})/,
        '<span class="big-time">$1</span>'
    );

    timeDisplay.innerHTML = timeParts;
}

let recognition;
setInterval(updateTime, 1000);
updateTime();
let isListening = false;


function setupSpeechRecognition() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            voiceBtn.classList.add('recording');
            voiceBtn.src = 'src/mic-act.png';
            voiceBtn.style.width = '80px';
            voiceBtn.style.height = '80px';
            inputSec.style.left = '25.5%';
            inputSec.style.top = '80%';
            if (recognitionStatus) {
                recognitionStatus.textContent = '•••';
            }
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (recognitionStatus) {
                recognitionStatus.textContent = '인식된 텍스트: ' + transcript;
            }
            addMessage(transcript, true);

            requestAnimationFrame(() => {
                processMessage(transcript);
            });
        };

        recognition.onerror = (event) => {
            if (recognitionStatus) {
                recognitionStatus.textContent = '오류 발생: ' + event.error;
            }
            voiceBtn.classList.remove('recording');
            isListening = false;
            const header1 = document.querySelector('.header1');
            if (header1) {
                header1.textContent = 'AI 현대';
            }
        };

        recognition.onend = () => {
            voiceBtn.classList.remove('recording');
            voiceBtn.src = 'src/mic.png';
            voiceBtn.removeAttribute('style');
            inputSec.removeAttribute('style');
            isListening = false;
            if (recognitionStatus) {
                recognitionStatus.textContent = '';
            }
            const header1 = document.querySelector('.header1');
            if (header1) {
                header1.textContent = 'AI 현대';
            }
        };
    } else {
        if (recognitionStatus) {
            recognitionStatus.textContent = '이 브라우저는 음성 인식을 지원하지 않습니다.';
        }
        voiceBtn.disabled = true;
    }
}

function sendMessage(message) {
    if (message.trim() === '') return;
    processMessage(message);
}

voiceBtn.addEventListener('click', () => {
    if (isListening) {
        recognition.stop();
        voiceBtn.src = 'src/mic-act.png';
        voiceBtn.style.width = '80px';
        voiceBtn.style.height = '80px';
        inputSec.style.left = '25.5%';
        inputSec.style.top = '80%';
    } else {
        if (recognition) {
            recognition.abort();
        }
        setupSpeechRecognition();
        recognition.start();
        voiceBtn.src = 'src/mic.png';
        voiceBtn.removeAttribute('style');
        inputSec.removeAttribute('style');
    }
});

async function speak(text) {
    try {
        if (typeof responsiveVoice !== "undefined") {
            if (responsiveVoice.isPlaying()) {
                responsiveVoice.cancel();
            }

            speechQueue = [];
            isSpeaking = true;

            responsiveVoice.speak(text, "Korean Male", {
                rate: 1,
                pitch: 0.8,
                volume: 1,
                onend: () => {
                    isSpeaking = false;
                    lastSpeechTime = Date.now();
                }
            });
        }
    } catch (error) {
        console.error("TTS 오류:", error);
        isSpeaking = false;
    }
}


function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    messageDiv.innerHTML = text;

    if (text === '•••' && !isUser) {
        messageDiv.classList.add('loading-message');
    }

    if (isUser && hudGraphic && hudGraphic.querySelector('img')) hudGraphic.querySelector('img').src = '';

    conversationLog.appendChild(messageDiv);
    conversationLog.scrollTop = conversationLog.scrollHeight;
}

function removeLoadingMessage() {
    const loadingMessage = conversationLog.querySelector('.loading-message');
    if (loadingMessage) {
        loadingMessage.onclick = null;
        loadingMessage.remove();
    }
}

function processMessage(message) {
    removeLoadingMessage();

    message = message.toLowerCase();

    if (message.includes('안녕') || message.includes('하이')) {
        aiResponse = "안녕! 오늘도 좋은 하루! 어떤 도움이 필요해?";
        speak(aiResponse);
        addMessage(aiResponse, false);
    }
    else if (message.includes('주차') || message.includes('도움') || message.includes('도우미')) {
        aiResponse = "현재 이마트 주차장에서 T자 주차가 필요한 상황이야?";
        speak(aiResponse);

        if (cvrSec) {
            cvrSec.style.background = "url('src/info-back1.png') right/cover no-repeat";
        }
        if (stateIcon) {
            const stateImage = stateIcon.querySelector('img');
            if (stateImage) {
                stateImage.src = 'src/state-p.png';
            }
        }
        addMessage(aiResponse, false);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('가볼게') || message.includes('저기까지')) {
        aiResponseText = "천천히 전진하면서 주차 라인의 경계선과 네 어깨를 맞춰볼래?";
        speak(aiResponseText);

        aiResponseHTML = "<img src='src/shoulder_150.gif' style='height: 150px; margin: 10px auto; display: block;'>" + "<br/>" + aiResponseText;
        if (hudGraphic) {
            const hudImage = hudGraphic.querySelector('img');
            if (hudImage) {
                hudImage.src = 'src/shoulder.gif';
            }
        }
        addMessage(aiResponseHTML, false);
        const AiMessage = document.querySelector('.ai-message:last-child');
        if (AiMessage) {
            AiMessage.style.padding = '30px 40px';
        }
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('괜찮아')) {
        aiResponseText = "주변에 네 주차를 방해할 장애물은? 많아?";
        speak(aiResponseText);

        aiResponseHTML = "<img src='src/obsta.png' style='height: 150px; margin: 10px auto; display: block;'>" + "<br/>" + aiResponseText;
        if (hudGraphic) {
            const hudImage = hudGraphic.querySelector('img');
            if (hudImage) {
                hudImage.src = 'src/obsta.png';
            }
        }
        addMessage(aiResponseHTML, false);
        const AiMessage = document.querySelector('.ai-message:last-child');
        if (AiMessage) {
            AiMessage.style.padding = '30px 40px';
        }
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('아니') || message.includes('아니야')) {
        aiResponseText = "주변 상황을 정확히 알 수 있게 카메라가 제대로 작동되고 있는지 확인해줄 수 있어?";
        speak(aiResponseText);

        aiResponseHTML = "<img src='src/camera.gif' style='height: 150px; margin: 10px auto; display: block;'>" + "<br/>" + aiResponseText;
        if (hudGraphic) {
            const hudImage = hudGraphic.querySelector('img');
            if (hudImage) {
                hudImage.src = 'src/camera.gif';
            }
        }
        addMessage(aiResponseHTML, false);
        const AiMessage = document.querySelector('.ai-message:last-child');
        if (AiMessage) {
            AiMessage.style.padding = '30px 40px';
        }
        currentScenarioStep = 3;
        NeResponse = true;
        updateScenarioDisplay();
    }
    else if (message.includes('배터리') && message.includes('교체')) {
        if (NeResponse) {
            aiResponse = "먼저 주차 공간 양 옆 차량 간격을 확인하자. 충분한 여유 공간이 있어?";
            speak(aiResponse);
            addMessage(aiResponse, false);
            NeResponse = false;
            currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
            updateScenarioDisplay();
        }
    }
    else if (message.includes('그래')) {
        aiResponseText = "주차하려는 곳보다 조금만 더 앞으로 가볼까??";
        speak(aiResponseText);

        aiResponseHTML = "<img src='src/forward2.png' style='height: 150px; margin: 10px auto; display: block;'>" + "<br/>" + aiResponseText;
        if (hudGraphic) {
            const hudImage = hudGraphic.querySelector('img');
            if (hudImage) {
                hudImage.src = 'src/forward.png';
            }
        }
        addMessage(aiResponseHTML, false);
        const AiMessage = document.querySelector('.ai-message:last-child');
        if (AiMessage) {
            AiMessage.style.padding = '30px 40px';
        }
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('맞아')) {
        if (!NeResponse) {
            aiResponse = "먼저 주차 공간 양 옆 차량 간격을 확인하자. 충분한 여유 공간이 있어?";
            speak(aiResponse);
            addMessage(aiResponse, false);
            currentScenarioStep = Math.min(currentScenarioStep + 2, scenarioSteps.length - 1);
            updateScenarioDisplay();
        }
    }
    else if (message.includes('어떻게') || message.includes('해야해')) {
        aiResponse = "조수석 옆 창문으로 보았을 때 네가 주차하려는 공간의 경계선과 어깨가 일직선인지 확인해 봐.";
        speak(aiResponse);
        addMessage(aiResponse, false);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('알았어')) {
        aiResponse = "사이드 미러로 차 뒷바퀴가 주차선 모서리를 지나가는지 확인해볼래? 그때 핸들을 조작할 거야. 차 길이와 주변을 확인해서 대강의 위치는 제공하지만 실제로도 맞는지 한 번 확인해 줘.";
        speak(aiResponse);
        addMessage(aiResponse, false);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('뒷바퀴') || message.includes('모서리')) {
        aiResponse = "그럼 이제 핸들을 조작하자.";
        speak(aiResponse);
        addMessage(aiResponse, false);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('좋아')) {
        aiResponse = "이제 기어를 R에 놓고 천천히 후진할 거야. 하나씩 해보자.";
        speak(aiResponse);
        addMessage(aiResponse, false);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('알겠어')) {
        aiResponseText = "사이드 미러를 봐볼래? 주차 공간 선이 살짝 보일 때 핸들을 오른쪽으로 끝까지 돌려 봐.";
        speak(aiResponseText);

        aiResponseHTML = "<img src='src/handle-r1.gif' style='height: 150px; margin: 10px auto; display: block;'>" + "<br/>" + aiResponseText;
        if (hudGraphic) {
            const hudImage = hudGraphic.querySelector('img');
            if (hudImage) {
                hudImage.src = 'src/handle-r2.gif';
            }
        }
        if (stateIcon) {
            const stateImage = stateIcon.querySelector('img');
            if (stateImage) {
                stateImage.src = 'src/state-r.png';
            }
        }
        addMessage(aiResponseHTML, false);
        const AiMessage = document.querySelector('.ai-message:last-child');
        if (AiMessage) {
            AiMessage.style.padding = '30px 40px';
        }
        if (cvrSec) {
            cvrSec.style.background = "url('src/info-back2.png') right/cover no-repeat";
        }
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('해') || message.includes('볼게') || message.includes('해볼게')) {
        aiResponseText = "이제 쭉 후진할 거야.";
        speak(aiResponseText);

        aiResponseHTML = "<img src='src/back_150.gif' style='height: 150px; margin: 10px auto; display: block;'>" + "<br/>" + aiResponseText;
        if (hudGraphic) {
            const hudImage = hudGraphic.querySelector('img');
            if (hudImage) {
                hudImage.src = 'src/back.gif';
            }
        }
        addMessage(aiResponseHTML, false);
        const AiMessage = document.querySelector('.ai-message:last-child');
        if (AiMessage) {
            AiMessage.style.padding = '30px 40px';
        }
        if (cvrSec) {
            cvrSec.style.background = "url('src/info-back3.png') right/cover no-repeat";
        }
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('오케') || message.includes('오케이') || message.includes('Ok')) {
        aiResponse = "잠깐만, 지금 핸들을 가운데 놓고 다시 후진해볼래?";
        speak(aiResponse);

        if (cvrSec) {
            cvrSec.style.background = "url('src/info-back4.png') right/cover no-repeat";
        }
        addMessage(aiResponse, false);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('지금')) {
        aiResponse = "후진 다 했어? 좌우 확인해볼래?";
        speak(aiResponse);
        addMessage(aiResponse, false);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('확인했어')) {
        aiResponse = "수고했어. 안전 주차했네. 이제 조금씩 전진과 후진을 반복해서 위치를 조정해도 돼.";
        speak(aiResponse);

        if (cvrSec) {
            cvrSec.style.background = "url('src/info-back5.png') right/cover no-repeat";
        }
        addMessage(aiResponse, false);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('같아')) {
        aiResponse = "기어를 P로 놓고 사이드 브레이크 작동하는 거 잊지 마.";
        speak(aiResponse);

        if (stateIcon) {
            const stateImage = stateIcon.querySelector('img');
            if (stateImage) {
                stateImage.src = 'src/state-break.png';
                stateIcon.style.margin = '0 0 5px 0';
                stateIcon.style.marginLeft = '0';
            }
        }
        addMessage(aiResponse, false);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('감사') || message.includes('고마워')) {
        aiResponse = "천만에! 오늘도 좋은 하루 보내.";
        speak(aiResponse);
        addMessage(aiResponse, false);
        if (scenarioDiv) {
            scenarioDiv.style.display = 'none';
        }
    }
    else if (message.includes('별로') || message.includes('없어')) {
        aiResponse = "주차할 공간이 충분히 확보 됐어? 이제 주차를 시작해볼까?";
        speak(aiResponse);
        addMessage(aiResponse, false);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('있어') || message.includes('있네') || message.includes('좀')) {
        aiResponse = "네가 안전하게 주차할 수 있다면 계속 주차를 진행하자.";
        speak(aiResponse);
        addMessage(aiResponse, false);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('좁아') || message.includes('조금')) {
        aiResponse = "그렇다면 충돌 위험이 있을 수 있으니 다른 곳을 찾아보자.";
        speak(aiResponse);
        addMessage(aiResponse, false);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('헤이') || message.includes('현')) {
        aiResponse = "응, 무슨 일이야?";
        speak(aiResponse);
        addMessage(aiResponse, false);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else {
        aiResponse = "미안, 잘 못 들었어. 다시 한 번 말해줄 수 있어?";
        speak(aiResponse);
        addMessage(aiResponse, false);
    }

    cleanupCounter++;
    if (cleanupCounter >= 15) {
        cleanupCounter = 0;
        setTimeout(() => {
            if (window.gc) {
                window.gc();
            }
            const oldMessages = conversationLog.querySelectorAll('.message');
            if (oldMessages.length > 20) {
                for (let i = 0; i < oldMessages.length - 15; i++) {
                    oldMessages[i].remove();
                }
            }
        }, 500);
    }
}

window.addEventListener('load', () => {
    scenarioDiv = document.querySelector('.scenario');
    setupSpeechRecognition();
    updateTime();
    updateScenarioDisplay();

    conversationLog.style.overflowY = 'auto';
});