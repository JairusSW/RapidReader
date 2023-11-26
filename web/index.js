let wordCount = 0;
let totalTime = 0;
let started = false;
let paused = false;
let progress = 0;
let wordByWordMode = true;
let startTime;
let spacePressed = false; // To prevent multiple starts on space bar press

const inputText = document.getElementById("inputText");
const textNode = document.getElementById("textContainer");
const speedSelect = document.getElementById("speedSelect");
const pauseButton = document.getElementsByClassName("pause-resume")[0];
const wpmText = document.getElementById("wpm");
const etaText = document.getElementById("timeRemaining");
const elapsedText = document.getElementById("timeElapsed");

async function togglePause() {
    paused = !paused;
    if (!started) {
        start();
        started = true;
        paused = false;
        pauseButton.innerHTML = "Pause";
    } else {
        pauseButton.innerHTML = paused ? "Resume" : "Pause";
    }
}

async function start() {
    const selectedSpeed = speedSelect.options[speedSelect.selectedIndex].value;

    // Get the value before clearing the input
    const textValue = inputText.value;

    inputText.value = ""; // Clear input text
    progress = 0;
    startTime = new Date();

    const msPerWord = selectedSpeed === "custom" ? textValue : Math.floor((60 * 1000) / selectedSpeed);
    const msPerLine = msPerWord * 1.5;
    const lines = textValue.split("\n");

    let totalWords = 0;
    for (const line of lines) {
        const words = line.split(" ");
        totalWords += words.length;
    }

    wpmText.innerHTML = 60;
    console.log("ETA: " + ((lines.length * msPerLine) + (totalWords * msPerWord)))
    etaText.innerText = getETA((lines.length * msPerLine) + (totalWords * msPerWord));
    const wordElement = document.createElement("div");
    wordElement.classList.add("current-text");
    wordElement.textContent = "";
    textNode.appendChild(wordElement);

    let secondsElapsed = 0;
    setInterval(() => {
        elapsedText.innerHTML = getETA(1000 * ++secondsElapsed);
    }, 1000);

    for (let i = 0; i < lines.length; i++) {
        if (wordByWordMode) {
            const words = lines[i].split(" ");
            await sleep(msPerWord * 1.5);
            for (let j = progress; j < words.length; j++) {
                await sleep(msPerWord);
                wordElement.innerHTML = words[j];
                wordCount++;
            }
            progress = 0;
        } else {
            const words = lines[i].split(" ");
            await sleep(msPerWord * 1.5);

            let innerHTML = textNode.innerHTML;
            const wordElement = document.createElement("div");
            wordElement.classList.add("current-text");
            wordElement.textContent = "";
            textNode.appendChild(wordElement);

            for (let j = progress; j < words.length; j++) {
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

function changeSpeed() {
    paused = false;
    progress = 0;
    wordCount = 0;
    document.getElementById("textNode").innerHTML = "";
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
    const modeSelect = document.getElementById("modeSelect");
    const selectedMode = modeSelect.options[modeSelect.selectedIndex].value;

    if (selectedMode === "word") {
        wordByWordMode = true;
    } else if (selectedMode === "line") {
        wordByWordMode = false;
    }

    paused = false;
    progress = 0;
    wordCount = 0;
    document.getElementById("textNode").innerHTML = "";
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