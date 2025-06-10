const WIT_API_KEY = '3CDDLBJSODOCVO3KJQPYJ4COXCFPCQG2';
const voiceBtn = document.getElementById('voice-btn');
const conversationLog = document.getElementById('conversation-log');
const recognitionStatus = document.getElementById('recognition-status');
const hudGraphic = document.querySelector('.status-graphic')
const stateIcon = document.querySelector('.state-icon')
const inputSec = document.querySelector('.input-section')
const cvrSec = document.querySelector('.conversation-section')
let NeResponse = false;
let scenarioDiv;
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
            sendMessage(transcript);
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
    sendToWit(message);
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
        speechSynthesis.cancel();
        await new Promise(resolve => setTimeout(resolve, 50));

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ko-KR";
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.onend = () => {
            utterance.onend = null;
            utterance.onerror = null;
        };

        speechSynthesis.speak(utterance);
    } catch (error) {
        console.error('speak 함수 오류:', error);
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

function sendToWit(message) {
    fetch(`https://api.wit.ai/message?v=20240519&q=${encodeURIComponent(message)}`, {
        headers: {
            'Authorization': `Bearer ${WIT_API_KEY}`
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log('Wit.ai 응답:', data);
            handleIntent(data, message);
        })
        .catch(error => {
            console.error('Wit.ai 오류:', error);
            processMessage(message, data);
        });
}

function handleIntent(data, message) {
    removeLoadingMessage();

    const intent = data.intents && data.intents.length > 0 ? data.intents[0].name : 'unknown';
    const confidence = data.intents && data.intents.length > 0 ? data.intents[0].confidence : 0;

    console.log(`의도: ${intent}, 신뢰도: ${confidence}`);

    const location = data.entities['location:location']?.[0]?.body;
    const direction = data.entities['direction:direction']?.[0]?.body;
    const distance = data.entities['distance:distance']?.[0]?.body;

    if (message.toLowerCase().includes('맞아')) {
        processMessage(message, data);
        return;
    }

    if (intent === 'parking_assistance' || message.includes('주차')) {
        processMessage(message, data);
        return;
    }

    switch (intent) {
        case 'navigate_to_location':
            const response = `${location || '목적지'}까지 길 안내를 시작할게요.`;
            addMessage(response, false);
            speak(response);
            break;

        case 'ask_nearest_gas':
            const gasResponse = "근처 주유소를 검색 중입니다.";
            addMessage(gasResponse, false);
            speak(gasResponse);
            break;

        case 'control_direction':
            const dirResponse = `${direction || '요청한 방향'}으로 ${distance || ''}${distance ? ' ' : ''}조정합니다.`;
            addMessage(dirResponse, false);
            speak(dirResponse);
            break;

        default:
            processMessage(message, data);
    }
}

function processMessage(message, witData = null) {
    removeLoadingMessage();

    message = message.toLowerCase();

    if (message.includes('안녕') || message.includes('하이')) {
        const aiResponse = "안녕! 오늘도 좋은 하루! 어떤 도움이 필요해?";
        addMessage(aiResponse, false);
        speak(aiResponse);
    }
    else if (message.includes('주차') || message.includes('도움') || message.includes('도우미')) {
        const aiResponse = "현재 이마트 주차장에서 T자 주차가 필요한 상황이야?";
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
        speak(aiResponse);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('가볼게') || message.includes('저기까지')) {
        const aiResponseText = "천천히 전진하면서 주차 라인의 경계선과 네 어깨를 맞춰볼래?";
        const aiResponseHTML = "<img src='src/shoulder_150.gif' style='height: 150px; margin: 10px auto; display: block;'>" + "<br/>" + aiResponseText ;
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
        speak(aiResponseText);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('괜찮아')) {
        const aiResponseText = "주변에 네 주차를 방해할 장애물은? 많아?";
        const aiResponseHTML = "<img src='src/obsta.png' style='height: 150px; margin: 10px auto; display: block;'>" + "<br/>" + aiResponseText ;
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
        speak(aiResponseText);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('아니') || message.includes('아니야')) {
        const aiResponseText = "주변 상황을 정확히 알 수 있게 카메라가 제대로 작동되고 있는지 확인해줄 수 있어?";
        const aiResponseHTML = "<img src='src/camera.gif' style='height: 150px; margin: 10px auto; display: block;'>" + "<br/>" + aiResponseText ;
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
        speak(aiResponseText);
        currentScenarioStep = 3;
        NeResponse = true;
        updateScenarioDisplay();
    }
    else if (message.includes('배터리') && message.includes('교체')) {
        if (NeResponse) {
            const aiResponse = "먼저 주차 공간 양 옆 차량 간격을 확인하자. 충분한 여유 공간이 있어?";
            addMessage(aiResponse, false);
            speak(aiResponse);
            NeResponse = false;
            currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
            updateScenarioDisplay();
        }
    }
    else if (message.includes('그래')) {
        const aiResponseText = "주차하려는 곳보다 조금만 더 앞으로 가볼까??";
        const aiResponseHTML = "<img src='src/forward2.png' style='height: 150px; margin: 10px auto; display: block;'>" + "<br/>" + aiResponseText ;
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
        speak(aiResponseText);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('맞아')) {
        if (!NeResponse) {
            const aiResponse = "먼저 주차 공간 양 옆 차량 간격을 확인하자. 충분한 여유 공간이 있어?";
            addMessage(aiResponse, false);
            speak(aiResponse);
            currentScenarioStep = Math.min(currentScenarioStep + 2, scenarioSteps.length - 1);
            updateScenarioDisplay();
        }
    }
    else if (message.includes('어떻게') || message.includes('해야해')) {
        const aiResponse = "조수석 옆 창문으로 보았을 때 네가 주차하려는 공간의 경계선과 어깨가 일직선인지 확인해 봐.";
        addMessage(aiResponse, false);
        speak(aiResponse);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('알았어')) {
        const aiResponse = "사이드 미러로 차 뒷바퀴가 주차선 모서리를 지나가는지 확인해볼래? 그때 핸들을 조작할 거야. 차 길이와 주변을 확인해서 대강의 위치는 제공하지만 실제로도 맞는지 한 번 확인해 줘.";
        addMessage(aiResponse, false);
        speak(aiResponse);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('뒷바퀴') || message.includes('모서리')) {
        const aiResponse = "그럼 이제 핸들을 조작하자.";
        addMessage(aiResponse, false);
        speak(aiResponse);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('좋아')) {
        const aiResponse = "이제 기어를 R에 놓고 천천히 후진할 거야. 하나씩 해보자.";
        addMessage(aiResponse, false);
        speak(aiResponse);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('알겠어')) {
        const aiResponseText = "사이드 미러를 봐볼래? 주차 공간 선이 살짝 보일 때 핸들을 오른쪽으로 끝까지 돌려 봐.";
        const aiResponseHTML = "<img src='src/handle-r1.gif' style='height: 150px; margin: 10px auto; display: block;'>" + "<br/>" + aiResponseText ;
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
        speak(aiResponseText);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('해') || message.includes('볼게') || message.includes('해볼게')) {
        const aiResponseText = "이제 쭉 후진할 거야.";
        const aiResponseHTML = "<img src='src/back_150.gif' style='height: 150px; margin: 10px auto; display: block;'>" + "<br/>" + aiResponseText ;
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
        speak(aiResponseText);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('오케') || message.includes('오케이') || message.includes('Ok')) {
        const aiResponse = "잠깐만, 지금 핸들을 가운데 놓고 다시 후진해볼래?";
        if (cvrSec) {
            cvrSec.style.background = "url('src/info-back4.png') right/cover no-repeat";
        }
        addMessage(aiResponse, false);
        speak(aiResponse);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('지금')) {
        const aiResponse = "후진 다 했어? 좌우 확인해볼래?";
        addMessage(aiResponse, false);
        speak(aiResponse);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('확인했어')) {
        const aiResponse = "수고했어. 안전 주차했네. 이제 조금씩 전진과 후진을 반복해서 위치를 조정해도 돼.";
        if (cvrSec) {
            cvrSec.style.background = "url('src/info-back5.png') right/cover no-repeat";
        }
        addMessage(aiResponse, false);
        speak(aiResponse);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('같아')) {
        const aiResponse = "기어를 P로 놓고 사이드 브레이크 작동하는 거 잊지 마.";
        if (stateIcon) {
            const stateImage = stateIcon.querySelector('img');
            if (stateImage) {
                stateImage.src = 'src/state-break.png';
                stateIcon.style.margin = '0 0 5px 0';
                stateIcon.style.marginLeft = '0';
            }
        }
        addMessage(aiResponse, false);
        speak(aiResponse);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('감사') || message.includes('고마워')) {
        const aiResponse = "천만에! 오늘도 좋은 하루 보내.";
        addMessage(aiResponse, false);
        speak(aiResponse);
        if (scenarioDiv) {
            scenarioDiv.style.display = 'none';
        }
    }
    else if (message.includes('별로') || message.includes('없어')) {
        const aiResponse = "주차할 공간이 충분히 확보 됐어? 이제 주차를 시작해볼까?";
        addMessage(aiResponse, false);
        speak(aiResponse);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('있어') || message.includes('있네') || message.includes('좀')) {
        const aiResponse = "네가 안전하게 주차할 수 있다면 계속 주차를 진행하자.";
        addMessage(aiResponse, false);
        speak(aiResponse);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('좁아') || message.includes('조금')) {
        const aiResponse = "그렇다면 충돌 위험이 있을 수 있으니 다른 곳을 찾아보자.";
        addMessage(aiResponse, false);
        speak(aiResponse);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else if (message.includes('헤이') || message.includes('현')) {
        const aiResponse = "응, 무슨 일이야?";
        addMessage(aiResponse, false);
        speak(aiResponse);
        currentScenarioStep = Math.min(currentScenarioStep + 1, scenarioSteps.length - 1);
        updateScenarioDisplay();
    }
    else {
        const aiResponse = "미안, 잘 못 들었어. 다시 한 번 말해줄 수 있어?";
        addMessage(aiResponse, false);
        speak(aiResponse);
    }
    cleanupCounter++;
    if (cleanupCounter >= 7) {
        cleanupCounter = 0;
        setTimeout(() => {
            if (window.gc) window.gc();
        }, 1000);
    }
}

window.addEventListener('load', () => {
    scenarioDiv = document.querySelector('.scenario');
    setupSpeechRecognition();
    updateTime();
    updateScenarioDisplay();

    conversationLog.style.overflowY = 'auto';
});