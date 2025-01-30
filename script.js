document.getElementById("fileInput").addEventListener("change", handleFile);
document.getElementById("searchBtn").addEventListener("click", searchClass);

let timetableData = {}; // Store parsed timetable

async function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        timetableData = {}; // Reset timetable data

        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // Ignore unnecessary sheets
            if (["Reserved Days", "BS Senior City Campus"].includes(sheetName)) return;

            // Process sheet into a structured format
            timetableData[sheetName.trim()] = processSheetData(jsonData);
        });

        alert("File uploaded successfully! You can now search.");
    };
    reader.readAsArrayBuffer(file);
}

// Function to process each day's sheet data
function processSheetData(sheetData) {
    let daysData = [];
    let headers = sheetData[2]; // Third row contains slot numbers or times
    let classrooms = sheetData.slice(4); // Schedule starts from row 5

    classrooms.forEach(row => {
        let venue = row[0]; // Classroom name
        if (!venue) return;

        for (let i = 1; i < row.length; i++) {
            if (row[i]) {
                let courseDetails = row[i].split("\n"); // Handle multiple classes in one cell
                courseDetails.forEach(course => {
                    daysData.push({
                        slot: i, // Use column index as slot number for sorting
                        time: headers[i] ? headers[i].trim() : "Unknown Time",
                        venue: venue.trim(),
                        classInfo: course.trim()
                    });
                });
            }
        }
    });

    return daysData;
}

// Function to search for multiple classes
function searchClass() {
    const searchInput = document.getElementById("searchInput").value.trim();
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "";

    if (!searchInput) {
        resultsContainer.innerHTML = "<p>Please enter class names.</p>";
        return;
    }

    // Convert search terms into an array & trim spaces
    let searchTerms = searchInput.split(",").map(term => term.trim().toLowerCase());

    let resultsByDay = {}; // Group results by day

    for (const [day, classes] of Object.entries(timetableData)) {
        let matchingClasses = classes.filter(entry =>
            searchTerms.some(term => entry.classInfo.toLowerCase().includes(term))
        );

        if (matchingClasses.length > 0) {
            matchingClasses.sort((a, b) => a.slot - b.slot); // Sort by slot number
            resultsByDay[day] = matchingClasses;
        }
    }

    // Display results grouped by day
    if (Object.keys(resultsByDay).length === 0) {
        resultsContainer.innerHTML = "<p>No matches found.</p>";
        return;
    }

    for (const [day, entries] of Object.entries(resultsByDay)) {
        let dayBlock = document.createElement("div");
        dayBlock.classList.add("day-section");

        let dayTitle = document.createElement("h3");
        dayTitle.textContent = day;
        dayBlock.appendChild(dayTitle);

        let classList = document.createElement("ul");
        entries.forEach(entry => {
            let listItem = document.createElement("li");
            listItem.textContent = `${entry.time} - ${entry.venue} - ${entry.classInfo}`;
            classList.appendChild(listItem);
        });

        dayBlock.appendChild(classList);
        resultsContainer.appendChild(dayBlock);
    }
}
