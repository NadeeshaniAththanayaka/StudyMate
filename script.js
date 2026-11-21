
/* ========================================
   STUDYMATE - MAIN JAVASCRIPT
======================================== */


/* ========================================
   1. LOCAL STORAGE
======================================== */

const TASKS_KEY = "studyMateTasks";
const PROFILE_KEY = "studyMateProfile";
const THEME_KEY = "studyMateTheme";

function loadData(key, defaultValue) {
    try {
        const savedData = localStorage.getItem(key);
        return savedData ? JSON.parse(savedData) : defaultValue;
    } catch (error) {
        console.error("Unable to load saved data:", error);
        return defaultValue;
    }
}

let tasks = loadData(TASKS_KEY, []);

let profile = loadData(PROFILE_KEY, {
    name: "",
    email: "",
    university: "",
    degree: "",
    academicYear: "",
    semester: "",
    image: ""
});

let currentFilter = "all";
let selectedImage = "";
let weeklyChart = null;
let summaryChart = null;

function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function saveProfile() {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}


/* ========================================
   2. COMMON FUNCTIONS
======================================== */

function getElement(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const characters = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return characters[character];
    });
}

function getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    if (!dateString) return "No date";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function isOverdue(task) {
    return !task.completed && task.dueDate < getToday();
}

function getCompletedTasks() {
    return tasks.filter(task => task.completed);
}

function getPendingTasks() {
    return tasks.filter(task => !task.completed);
}


/* ========================================
   3. PAGE NAVIGATION
======================================== */

const pageInformation = {
    dashboard: {
        title: "Dashboard",
        subtitle: "Your study overview"
    },
    tasks: {
        title: "My Tasks",
        subtitle: "Manage your study activities"
    },
    subjects: {
        title: "My Subjects",
        subtitle: "Track your subject progress"
    },
    analytics: {
        title: "Analytics",
        subtitle: "Your study performance"
    },
    profile: {
        title: "My Profile",
        subtitle: "Manage your student information"
    },
    settings: {
        title: "Settings",
        subtitle: "Customize your StudyMate experience"
    }
};

function showPage(pageName) {
    const page = getElement(pageName + "Page");

    if (!page) return;

    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.remove("active");
    });

    page.classList.add("active");

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    const information = pageInformation[pageName];

    if (information) {
        getElement("pageTitle").textContent = information.title;
        getElement("pageSubtitle").textContent = information.subtitle;
    }

    if (pageName === "analytics") {
        updateAnalytics();
    }

    if (pageName === "subjects") {
        updateSubjects();
    }

    if (pageName === "profile") {
        loadProfileForm();
    }

    const sidebar = getElement("sidebar");
    sidebar.classList.remove("open");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", function () {
        showPage(this.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", function () {
        showPage(this.dataset.go);
    });
});


/* ========================================
   4. MOBILE SIDEBAR
======================================== */

getElement("menuToggle").addEventListener("click", function () {
    getElement("sidebar").classList.toggle("open");
});


/* ========================================
   5. TASK MANAGEMENT
======================================== */

const taskForm = getElement("taskForm");

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const taskName = getElement("taskName").value.trim();
    const subject = getElement("subject").value.trim();
    const dueDate = getElement("dueDate").value;
    const priority = getElement("priority").value;

    const editId = getElement("editTaskId").value;

    if (!taskName || !subject || !dueDate) {
        alert("Please complete all required fields.");
        return;
    }

    if (editId) {
        const task = tasks.find(item => item.id === Number(editId));

        if (task) {
            task.name = taskName;
            task.subject = subject;
            task.dueDate = dueDate;
            task.priority = priority;
        }

    } else {
        const newTask = {
            id: Date.now(),
            name: taskName,
            subject: subject,
            dueDate: dueDate,
            priority: priority,
            completed: false,
            completedAt: null
        };

        tasks.push(newTask);
    }

    saveTasks();

    taskForm.reset();
    resetTaskForm();

    updateApp();

});


/* ========================================
   6. RESET TASK FORM
======================================== */

function resetTaskForm() {
    getElement("editTaskId").value = "";

    getElement("taskFormTitle").textContent = "Add New Task";

    getElement("submitTaskBtn").textContent = "➕ Add Task";

    getElement("cancelEditBtn").hidden = true;

    getElement("priority").value = "Medium";
}

getElement("cancelEditBtn").addEventListener("click", function () {
    taskForm.reset();
    resetTaskForm();
});


/* ========================================
   7. TASK ACTIONS
======================================== */

getElement("taskList").addEventListener("click", function (event) {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const taskId = Number(button.dataset.id);

    const task = tasks.find(item => item.id === taskId);

    if (!task) return;

    const action = button.dataset.action;

    if (action === "edit") {

        getElement("editTaskId").value = task.id;
        getElement("taskName").value = task.name;
        getElement("subject").value = task.subject;
        getElement("dueDate").value = task.dueDate;
        getElement("priority").value = task.priority;

        getElement("taskFormTitle").textContent = "Edit Task";
        getElement("submitTaskBtn").textContent = "💾 Update Task";
        getElement("cancelEditBtn").hidden = false;

        getElement("taskForm").scrollIntoView({
            behavior: "smooth"
        });

    }

    if (action === "delete") {

        const confirmDelete = confirm(
            "Are you sure you want to delete this task?"
        );

        if (confirmDelete) {
            tasks = tasks.filter(item => item.id !== taskId);

            saveTasks();
            updateApp();
        }

    }

    if (action === "toggle") {

        task.completed = !task.completed;

        if (task.completed) {
            task.completedAt = new Date().toISOString();
        } else {
            task.completedAt = null;
        }

        saveTasks();
        updateApp();
    }

});


/* ========================================
   8. DISPLAY TASKS
======================================== */

function displayTasks() {

    const taskList = getElement("taskList");

    const searchText = getElement("searchInput").value
        .trim()
        .toLowerCase();

    let filteredTasks = [...tasks];

    if (currentFilter === "pending") {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    }

    if (currentFilter === "completed") {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }

    if (currentFilter === "overdue") {
        filteredTasks = filteredTasks.filter(task => isOverdue(task));
    }

    filteredTasks = filteredTasks.filter(task => {
        return (
            task.name.toLowerCase().includes(searchText) ||
            task.subject.toLowerCase().includes(searchText)
        );
    });

    filteredTasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <p class="empty-message">
                No tasks found.
            </p>
        `;
        return;
    }

    taskList.innerHTML = filteredTasks.map(task => {

        const priorityClass = task.priority.toLowerCase();

        let statusText = task.completed
            ? "Completed"
            : isOverdue(task)
                ? "Overdue"
                : "Due: " + formatDate(task.dueDate);

        return `
            <div class="task-item ${task.completed ? "completed" : ""}">

                <div class="task-main">

                    <input
                        type="checkbox"
                        data-action="toggle"
                        data-id="${task.id}"
                        ${task.completed ? "checked" : ""}
                        aria-label="Mark task as completed"
                    >

                    <div class="task-details">

                        <h4>${escapeHTML(task.name)}</h4>

                        <p>${escapeHTML(task.subject)}</p>

                        <div class="task-meta">

                            <span class="priority ${priorityClass}">
                                ${escapeHTML(task.priority)} Priority
                            </span>

                            <span>${escapeHTML(statusText)}</span>

                        </div>

                    </div>

                </div>

                <div class="task-actions">

                    <button data-action="edit" data-id="${task.id}">
                        ✏️ Edit
                    </button>

                    <button data-action="delete" data-id="${task.id}">
                        🗑️ Delete
                    </button>

                </div>

            </div>
        `;

    }).join("");

}


/* ========================================
   9. TASK SEARCH
======================================== */

getElement("searchInput").addEventListener("input", function () {
    displayTasks();
});


/* ========================================
   10. TASK FILTERS
======================================== */

document.querySelectorAll(".filter-btn").forEach(button => {

    button.addEventListener("click", function () {

        currentFilter = this.dataset.filter;

        document.querySelectorAll(".filter-btn").forEach(filterButton => {
            filterButton.classList.remove("active");
        });

        this.classList.add("active");

        displayTasks();

    });

});


/* ========================================
   11. DASHBOARD STATISTICS
======================================== */

function updateDashboard() {

    const total = tasks.length;
    const completed = getCompletedTasks().length;
    const pending = getPendingTasks().length;
    const overdue = tasks.filter(task => isOverdue(task)).length;

    getElement("totalTasks").textContent = total;
    getElement("completedTasks").textContent = completed;
    getElement("pendingTasks").textContent = pending;
    getElement("overdueTasks").textContent = overdue;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    getElement("progressText").textContent = percentage + "%";

    getElement("progressBar").style.width = percentage + "%";

    let message = "Start adding tasks to track your progress.";

    if (total > 0 && percentage === 100) {
        message = "Excellent! You completed all your tasks. 🎉";
    } else if (percentage >= 70) {
        message = "Great work! You are making excellent progress.";
    } else if (percentage >= 40) {
        message = "Good job! Keep working towards your goals.";
    } else if (total > 0) {
        message = "Keep going! Every completed task is progress.";
    }

    getElement("progressMessage").textContent = message;

    displayUpcomingTasks();

}


/* ========================================
   12. UPCOMING TASKS
======================================== */

function displayUpcomingTasks() {

    const container = getElement("upcomingTasks");

    const upcoming = getPendingTasks()
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5);

    if (upcoming.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                No upcoming tasks. Add a new task to get started!
            </p>
        `;

        return;
    }

    container.innerHTML = upcoming.map(task => {

        const status = isOverdue(task)
            ? "Overdue"
            : formatDate(task.dueDate);

        return `
            <div class="task-item">

                <div class="task-main">

                    <div class="task-details">
                        <h4>${escapeHTML(task.name)}</h4>
                        <p>${escapeHTML(task.subject)}</p>
                    </div>

                </div>

                <div class="task-actions">
                    <span>${escapeHTML(status)}</span>
                </div>

            </div>
        `;

    }).join("");

}


/* ========================================
   13. SUBJECT PROGRESS
======================================== */

function updateSubjects() {

    const subjectGroups = {};

    tasks.forEach(task => {

        const subjectName = task.subject.trim();
        const key = subjectName.toLowerCase();

        if (!subjectGroups[key]) {
            subjectGroups[key] = {
                name: subjectName,
                total: 0,
                completed: 0
            };
        }

        subjectGroups[key].total++;

        if (task.completed) {
            subjectGroups[key].completed++;
        }

    });

    const subjects = Object.values(subjectGroups);

    getElement("totalSubjects").textContent = subjects.length;

    getElement("subjectCompletedTasks").textContent =
        getCompletedTasks().length;

    getElement("subjectPendingTasks").textContent =
        getPendingTasks().length;

    const container = getElement("subjectProgressList");

    if (subjects.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                Add tasks with subject names to see your subject progress.
            </p>
        `;

        return;
    }

    container.innerHTML = subjects.map(subject => {

        const percentage = Math.round(
            (subject.completed / subject.total) * 100
        );

        return `
            <div class="subject-item">

                <div class="subject-info">

                    <h4>${escapeHTML(subject.name)}</h4>

                    <span>
                        ${subject.completed}/${subject.total}
                        Tasks (${percentage}%)
                    </span>

                </div>

                <div class="subject-track">
                    <div
                        class="subject-fill"
                        style="width: ${percentage}%">
                    </div>
                </div>

            </div>
        `;

    }).join("");

}


/* ========================================
   14. ANALYTICS
======================================== */

function updateAnalytics() {

    const total = tasks.length;
    const completed = getCompletedTasks().length;

    const rate = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    getElement("analyticsTotal").textContent = total;
    getElement("analyticsCompleted").textContent = completed;
    getElement("analyticsRate").textContent = rate + "%";

    updateCharts();

}


/* ========================================
   15. CHARTS
======================================== */

function updateCharts() {

    if (typeof Chart === "undefined") {
        return;
    }

    const weeklyCanvas = getElement("weeklyChart");
    const summaryCanvas = getElement("taskSummaryChart");

    if (!weeklyCanvas || !summaryCanvas) {
        return;
    }

    const textColor = document.body.classList.contains("dark-mode")
        ? "#cbd5e1"
        : "#64748b";

    const gridColor = document.body.classList.contains("dark-mode")
        ? "#334155"
        : "#e2e8f0";

    const labels = [];
    const weeklyData = [];

    for (let i = 6; i >= 0; i--) {

        const date = new Date();

        date.setDate(date.getDate() - i);

        const dateKey = date.toDateString();

        labels.push(date.toLocaleDateString("en", {
            weekday: "short"
        }));

        const count = tasks.filter(task => {

            if (!task.completed || !task.completedAt) {
                return false;
            }

            return new Date(task.completedAt).toDateString() === dateKey;

        }).length;

        weeklyData.push(count);

    }


    if (weeklyChart) {
        weeklyChart.destroy();
    }

    weeklyChart = new Chart(weeklyCanvas, {

        type: "bar",

        data: {
            labels: labels,

            datasets: [{
                label: "Completed Tasks",
                data: weeklyData,

                backgroundColor: "#6366f1",

                borderRadius: 7,

                maxBarThickness: 35
            }]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {

                x: {
                    ticks: {
                        color: textColor
                    },

                    grid: {
                        display: false
                    }
                },

                y: {
                    beginAtZero: true,

                    ticks: {
                        color: textColor,
                        precision: 0
                    },

                    grid: {
                        color: gridColor
                    }
                }

            }

        }

    });


    if (summaryChart) {
        summaryChart.destroy();
    }

    const completedCount = getCompletedTasks().length;
    const pendingCount = getPendingTasks().length;

    summaryChart = new Chart(summaryCanvas, {

        type: "doughnut",

        data: {

            labels: ["Completed", "Pending"],

            datasets: [{
                data: [completedCount, pendingCount],

                backgroundColor: [
                    "#16a34a",
                    "#f59e0b"
                ],

                borderWidth: 0
            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            plugins: {

                legend: {
                    position: "bottom",

                    labels: {
                        color: textColor,
                        padding: 20
                    }
                }

            }

        }

    });

}


/* ========================================
   16. STUDENT PROFILE
======================================== */

function loadProfileForm() {

    getElement("studentName").value = profile.name || "";
    getElement("studentEmail").value = profile.email || "";
    getElement("university").value = profile.university || "";
    getElement("degreeProgram").value = profile.degree || "";

    getElement("academicYear").value = profile.academicYear || "";
    getElement("semester").value = profile.semester || "";

    selectedImage = profile.image || "";

    displayProfile();

}


function displayProfile() {

    const name = profile.name || "Student Name";
    const email = profile.email || "student@example.com";

    getElement("profileDisplayName").textContent = name;
    getElement("profileDisplayEmail").textContent = email;

    getElement("welcomeName").textContent =
        profile.name || "Student";

    const firstLetter = (profile.name || "S").charAt(0).toUpperCase();

    const preview = getElement("profilePreview");
    const avatar = getElement("headerAvatar");

    if (profile.image) {

        const image = document.createElement("img");
        image.src = profile.image;
        image.alt = "Student profile photo";

        preview.replaceChildren(image);

        const avatarImage = document.createElement("img");
        avatarImage.src = profile.image;
        avatarImage.alt = "Profile";

        avatar.replaceChildren(avatarImage);

    } else {

        preview.innerHTML = `
            <div class="profile-placeholder">👤</div>
        `;

        avatar.textContent = firstLetter;

    }

}


getElement("profileImage").addEventListener("change", function () {

    const file = this.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file.");
        this.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {

        alert("Image size must be less than 2MB.");

        this.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {

        selectedImage = event.target.result;

        const image = document.createElement("img");
        image.src = selectedImage;
        image.alt = "Student profile photo";

        getElement("profilePreview").replaceChildren(image);

    };

    reader.readAsDataURL(file);

});


getElement("profileForm").addEventListener("submit", function (event) {

    event.preventDefault();

    profile.name = getElement("studentName").value.trim();
    profile.email = getElement("studentEmail").value.trim();
    profile.university = getElement("university").value.trim();
    profile.degree = getElement("degreeProgram").value.trim();

    profile.academicYear = getElement("academicYear").value;
    profile.semester = getElement("semester").value;

    profile.image = selectedImage;

    try {

        saveProfile();

        displayProfile();

        getElement("profileMessage").textContent =
            "Profile saved successfully!";

        getElement("profileMessage").style.color = "#16a34a";

    } catch (error) {

        getElement("profileMessage").textContent =
            "Unable to save. Try using a smaller profile image.";

        getElement("profileMessage").style.color = "#ef4444";

        console.error("Profile saving error:", error);

    }

});


/* ========================================
   17. LIGHT MODE / DARK MODE
======================================== */

function setTheme(theme) {

    document.body.classList.toggle(
        "dark-mode",
        theme === "dark"
    );

    localStorage.setItem(THEME_KEY, theme);

    getElement("headerThemeToggle").textContent =
        theme === "dark" ? "☀️" : "🌙";

    getElement("lightThemeBtn").classList.toggle(
        "active",
        theme === "light"
    );

    getElement("darkThemeBtn").classList.toggle(
        "active",
        theme === "dark"
    );

    if (getElement("analyticsPage").classList.contains("active")) {
        updateCharts();
    }

}


const savedTheme = localStorage.getItem(THEME_KEY) || "light";

setTheme(savedTheme);


getElement("headerThemeToggle").addEventListener("click", function () {

    const newTheme = document.body.classList.contains("dark-mode")
        ? "light"
        : "dark";

    setTheme(newTheme);

});


getElement("lightThemeBtn").addEventListener("click", function () {
    setTheme("light");
});


getElement("darkThemeBtn").addEventListener("click", function () {
    setTheme("dark");
});


/* ========================================
   18. DATE AND INITIALIZATION
======================================== */

function displayTodayDate() {

    const today = new Date();

    getElement("todayDate").textContent =
        today.toLocaleDateString("en", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });

}


/* ========================================
   19. UPDATE ALL APP FEATURES
======================================== */

function updateApp() {

    displayTasks();

    updateDashboard();

    updateSubjects();

    if (getElement("analyticsPage").classList.contains("active")) {
        updateAnalytics();
    }

}


/* ========================================
   20. START STUDYMATE
======================================== */

displayTodayDate();

displayProfile();

loadProfileForm();

updateApp();

showPage("dashboard");

console.log("StudyMate started successfully!");
