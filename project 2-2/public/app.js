
// API Service Module - Handles all backend communication
const ExamService = {
    /**
     * Fetches all exams from the database
     * @returns {Promise<Array>} Array of exam objects
     */
    getAllExams: async function() {
        try {
            const response = await fetch('http://localhost:3000/api/exams');
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch exams:', error);
            throw error;
        }
    },

    /**
     * Creates a new exam
     * @param {Object} examData - The exam data to create
     * @returns {Promise<Object>} The created exam
     */
    createExam: async function(examData) {
        await fetch('http://localhost:3000/api/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(examData)
            });
    },

    /**
     * Cancels an existing exam
     * @param {string} course - Course name
     * @param {number} examNo - Exam number
     * @param {number} batch - Batch number
     * @returns {Promise<boolean>} True if successful
     */
    cancelExam: async function(course, examNo, batch) {
        try {
            const response = await fetch(
                `http://localhost:3000/api/exams/${encodeURIComponent(course)}/${examNo}/${batch}`, 
                { method: 'DELETE' }
            );
            if (!response.ok) throw new Error('Failed to cancel exam');
            return true;
        } catch (error) {
            console.error('Failed to cancel exam:', error);
            throw error;
        }
    },

    /**
     * Reschedules an exam
     * @param {string} course - Course name
     * @param {number} examNo - Exam number
     * @param {number} batch - Batch number
     * @param {string} newDate - New exam date (YYYY-MM-DD)
     * @param {string} newTime - New start time (HH:MM)
     * @returns {Promise<boolean>} True if successful
     */
    rescheduleExam: async function(course, examNo, batch, newDate, newTime) {
        try {
            const response = await fetch(
                `http://localhost:3000/api/exams/${encodeURIComponent(course)}/${examNo}/${batch}/reschedule`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ new_date: newDate, new_time: newTime })
                }
            );
            if (!response.ok) throw new Error('Failed to reschedule exam');
            return true;
        } catch (error) {
            console.error('Failed to reschedule exam:', error);
            throw error;
        }
    },

    /**
     * Updates exam duration
     * @param {string} course - Course name
     * @param {number} examNo - Exam number
     * @param {number} batch - Batch number
     * @param {number} newDuration - New duration in minutes
     * @returns {Promise<boolean>} True if successful
     */
    updateDuration: async function(course, examNo, batch, newDuration) {
        try {
            const response = await fetch(
                `http://localhost:3000/api/exams/${encodeURIComponent(course)}/${examNo}/${batch}/duration`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ new_duration: parseInt(newDuration) })
                }
            );
            if (!response.ok) throw new Error('Failed to update duration');
            return true;
        } catch (error) {
            console.error('Failed to update duration:', error);
            throw error;
        }
    }
};

// UI Controller - Handles all UI interactions
const ExamController = {
    /**
     * Loads and displays all exams
     */
    loadExams: async function() {
        try {
            const exams = await ExamService.getAllExams();
            this.renderExams(exams);
        } catch (error) {
            alert('Failed to load exams. Please try again.');
        }
    },

    /**
     * Renders exams to the table
     * @param {Array} exams - Array of exam objects
     */
    renderExams: function(exams) {
        const tbody = document.querySelector('#examTable tbody');
        tbody.innerHTML = exams.map(exam => `
            <tr data-course="${exam.course_name}" 
                data-exam="${exam.exam_no}" 
                data-batch="${exam.batch}">
                <td>${exam.course_name}</td>
                <td>${exam.exam_no}</td>
                <td>Batch ${exam.batch}</td>
                <td>${new Date(exam.exam_date).toLocaleDateString()}</td>
                <td>${exam.start_time}</td>
                <td>${exam.duration_minutes} mins</td>
                <td>${exam.finish_time}</td>
                <td class="actions">
                    <button class="cancel-btn">Cancel</button>
                    <button class="reschedule-btn">Reschedule</button>
                    <button class="duration-btn">Change Duration</button>
                </td>
            </tr>
        `).join('');

        this.setupEventListeners();
    },

    /**
     * Sets up all event listeners
     */
    setupEventListeners: function() {
        // Cancel buttons
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', this.handleCancelExam.bind(this));
        });

        // Reschedule buttons
        document.querySelectorAll('.reschedule-btn').forEach(btn => {
            btn.addEventListener('click', this.showRescheduleForm.bind(this));
        });

        // Duration buttons
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.addEventListener('click', this.showDurationForm.bind(this));
        });

        // Form submission
        document.getElementById('examForm').addEventListener('submit', this.handleCreateExam.bind(this));
    },

    /**
     * Handles exam cancellation
     * @param {Event} e - Click event
     */
    handleCancelExam: async function(e) {
        const row = e.target.closest('tr');
        const { course, exam, batch } = row.dataset;

        if (confirm(`Cancel ${course} Exam ${exam} for Batch ${batch}?`)) {
            try {
                await ExamService.cancelExam(course, exam, batch);
                this.loadExams();
                alert('Exam cancelled successfully!');
            } catch (error) {
                alert(`Failed to cancel exam: ${error.message}`);
            }
        }
    },

    /**
     * Shows the reschedule form
     * @param {Event} e - Click event
     */
    showRescheduleForm: function(e) {
        const row = e.target.closest('tr');
        row.innerHTML += `
            <td colspan="8" class="reschedule-form">
                <input type="date" class="new-date" required>
                <input type="time" class="new-time" required>
                <button class="confirm-reschedule">Confirm</button>
                <button class="cancel-action">Cancel</button>
            </td>
        `;

        row.querySelector('.confirm-reschedule').addEventListener('click', this.handleRescheduleExam.bind(this));
        row.querySelector('.cancel-action').addEventListener('click', () => this.loadExams());
    },

    /**
     * Handles exam rescheduling
     * @param {Event} e - Click event
     */
    handleRescheduleExam: async function(e) {
        const row = e.target.closest('tr');
        const { course, exam, batch } = row.dataset;
        const newDate = row.querySelector('.new-date').value;
        const newTime = row.querySelector('.new-time').value;

        if (!newDate || !newTime) {
            alert('Please enter both date and time');
            return;
        }

        try {
            await ExamService.rescheduleExam(course, exam, batch, newDate, newTime);
            this.loadExams();
            alert('Exam rescheduled successfully!');
        } catch (error) {
            alert(`Failed to reschedule exam: ${error.message}`);
        }
    },

    /**
     * Shows the duration change form
     * @param {Event} e - Click event
     */
    showDurationForm: function(e) {
        const row = e.target.closest('tr');
        row.innerHTML += `
            <td colspan="8" class="duration-form">
                <input type="number" class="new-duration" placeholder="New duration (minutes)" required min="1">
                <button class="confirm-duration">Update</button>
                <button class="cancel-action">Cancel</button>
            </td>
        `;

        row.querySelector('.confirm-duration').addEventListener('click', this.handleUpdateDuration.bind(this));
        row.querySelector('.cancel-action').addEventListener('click', () => this.loadExams());
    },

    /**
     * Handles duration update
     * @param {Event} e - Click event
     */
    handleUpdateDuration: async function(e) {
        const row = e.target.closest('tr');
        const { course, exam, batch } = row.dataset;
        const newDuration = row.querySelector('.new-duration').value;

        if (!newDuration || newDuration <= 0) {
            alert('Please enter a valid duration');
            return;
        }

        try {
            await ExamService.updateDuration(course, exam, batch, newDuration);
            this.loadExams();
            alert('Duration updated successfully!');
        } catch (error) {
            alert(`Failed to update duration: ${error.message}`);
        }
    },

    /**
     * Handles new exam creation
     * @param {Event} e - Form submit event
     */
    handleCreateExam: async function(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const examData = Object.fromEntries(formData.entries());

        try {
            await ExamService.createExam(examData);
            this.loadExams();
            e.target.reset();
            alert('Exam created successfully!');
        } catch (error) {
            alert(`Failed to create exam: ${error.message}`);
        }
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    ExamController.loadExams();
});