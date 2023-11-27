const maxCharsDisplayed = 60;
let wordCount = 0;
let totalTime = 0;
let started = false;
let paused = false;
let progress = 0;
let wordByWordMode = true;
let startTime;
let spacePressed = false; // To prevent multiple starts on space bar press

const inputText = document.getElementById("inputText");
const speedSelect = document.getElementById("speedSelect");
const modeSelect = document.getElementById("modeSelect");
const playPause = document.getElementsByClassName("pause-resume")[0];
const wpmText = document.getElementById("wpm");
const etaText = document.getElementById("timeRemaining");
const elapsedText = document.getElementById("timeElapsed");
let textNode;

let selectedSpeed;
let textValue;
let msPerWord;
let msPerLine;

let pausePromise;
let lines;

let totalLines = 0;
let totalWords = 0;
let totalPeriods = 0;
let totalCommas = 0;

async function start() {
    textNode = document.createElement("div"); // Create the div element
    textNode.id = "textContainer";
    textNode.className = "text";
    document.body.appendChild(textNode);

    inputText.hidden = true;
    speedSelect.hidden = true;
    modeSelect.hidden = true;
    playPause.hidden = true;

    textNode.hidden = false;
    textNode.innerHTML = "";
    selectedSpeed = speedSelect.options[speedSelect.selectedIndex].value;

    // Get the value before clearing the input
    textValue = inputText.value.trim();

    inputText.value = ""; // Clear input text
    progress = 0;
    startTime = new Date();

    msPerWord = selectedSpeed === "custom" ? textValue : Math.floor((60 * 1000) / selectedSpeed);
    msPerLine = msPerWord * 1.5;

    lines = textValue.split("\n");

    totalLines = lines.length;
    for (const line of lines) {
        const words = line.split(" ");
        totalWords += words.length;
        for (const word of words) {
            if (word.endsWith(".")) totalPeriods++;
            else if (word.endsWith(",")) totalCommas++;
        }
    }

    wpmText.innerHTML = selectedSpeed;
    etaText.innerText = getETA((lines.length * msPerLine) + (totalWords * msPerWord));

    const wordElement = document.createElement("div");
    wordElement.classList.add("current-text");
    wordElement.textContent = "";
    textNode.appendChild(wordElement);

    let secondsElapsed = 0;
    setInterval(() => {
        if (!paused) elapsedText.innerHTML = getETA(1000 * ++secondsElapsed);
    }, 1000);

    for (let i = 0; i < lines.length; i++) {
        if (wordByWordMode) {
            const words = lines[i].split(" ");
            for (let j = progress; j < words.length; j++) {
                if (paused) {
                    await pausePromise;
                }
                const word = words[j];
                wordElement.innerHTML = word;
                wordCount++;
                await sleep(msPerWord);
            }
            await sleep(msPerWord * 0.5);
            progress = 0;
        } else {
            const words = lines[i].split(" ");
            await sleep(msPerWord * 1.5);

            const wordElement = document.createElement("div");
            wordElement.classList.add("current-text");
            wordElement.textContent = "";
            textNode.appendChild(wordElement);

            for (let j = progress; j < words.length; j++) {
                if (paused) {
                    await pausePromise;
                }
                await sleep(msPerWord);
                wordElement.textContent += " " + words[j];
                wordCount++;
            }

            wordElement.className = "completed-text";
            progress = 0;
        }
    }

    const endTime = new Date();
    const elapsedMinutes = (endTime - startTime) / 60000;
    const wpm = Math.round(wordCount / elapsedMinutes);
    document.getElementById("wpm").innerText = wpm;
    document.getElementById("timeElapsed").innerText = formatTime(elapsedMinutes * 60000);
}

async function togglePause() {
    paused = !paused;
    if (!started) {
        start();
        started = true;
        paused = false;
    } else {
        if (paused) {
            pausePromise = new Promise(resolve => {
                let down = false;
                const resumeHandler = (event) => {
                    if (down) return;
                    if (event.code === "Space") {
                        down = true;
                    }
                    spacePressed = false;
                    resolve();
                    document.removeEventListener("keydown", resumeHandler);
                };
                document.addEventListener("keydown", resumeHandler);
            });
            await pausePromise;
        }
    }
}

function changeSpeed() {
    selectedSpeed = speedSelect.options[speedSelect.selectedIndex].value;

    msPerWord = selectedSpeed === "custom" ? textValue : Math.floor((60 * 1000) / selectedSpeed);
    msPerLine = msPerWord * 1.5;

    wpmText.innerHTML = selectedSpeed;
    etaText.innerText = getETA((lines.length * msPerLine) + (totalWords * msPerWord));
}

function formatTime(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
    return `${minutes}:${(seconds < 10 ? "0" : "")}${seconds}`;
}

function getETA(milliseconds) {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
    let result = "";
    if (hours) result += hours + "h ";
    if (minutes) {
        if (!hours) {
            result += minutes + "m " + seconds + "s";
        } else {
            result += minutes + "m";
        }
    }

    if (!hours && !minutes) result = seconds + "s";
    return result;
}

function toggleMode() {
    const selectedMode = modeSelect.options[modeSelect.selectedIndex].value;

    if (selectedMode === "word") {
        wordByWordMode = true;
    } else if (selectedMode === "line") {
        wordByWordMode = false;
    }

    paused = false;
    progress = 0;
    wordCount = 0;
    textNode.innerHTML = ""; // Corrected the id to match the HTML
}

function saveProgress() {
    // Add your logic to save the progress
    alert("Progress saved!");
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

document.addEventListener("keydown", function (event) {
    if (event.code === "Space" && !spacePressed) {
        spacePressed = true;
        togglePause();
        updateRemainingTime(progress, wordCount, new Date() - startTime);
    }
});

document.addEventListener("keyup", function (event) {
    if (event.code === "Space") {
        spacePressed = false;
    }
});

function updateRemainingTime(currentWord, totalWords, elapsedMilliseconds) {
    const remainingWords = totalWords - currentWord;
    const estimatedMilliseconds = (elapsedMilliseconds / currentWord) * remainingWords;
    const remainingTime = formatTime(estimatedMilliseconds);
    //document.getElementById("timeRemaining").innerText = remainingTime;
}
