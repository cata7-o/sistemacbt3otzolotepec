// Sistema de Calificaciones para Docentes con Reportes por Materia
class GradingSystem {
    constructor() {
        // Datos en memoria
        this.teachers = [];
        this.currentTeacher = null;
        this.students = [];
        this.subjects = [];
        this.grades = {};
        
        // Reglas de calificación exactas
        this.rules = {
            passingGrade: 6,
            minTotalToPass: 18,
            extraordinaryTotal: 17,
            maxFailedPartialsToPass: 1
        };
        
        this.statusTypes = {
            approved: "APROBADO",
            extraordinary: "EXTRAORDINARIO", 
            failed: "REPROBADO"
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.showScreen('login-screen');
    }
    
    bindEvents() {
        // Login y registro
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('show-register').addEventListener('click', () => this.showScreen('register-screen'));
        document.getElementById('back-to-login').addEventListener('click', () => this.showScreen('login-screen'));
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        
        // Navegación de tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Gestión de estudiantes y materias
        document.getElementById('student-form').addEventListener('submit', (e) => this.addStudent(e));
        document.getElementById('subject-form').addEventListener('submit', (e) => this.addSubject(e));
        
        // Reportes por materia
        document.getElementById('subject-selector').addEventListener('change', (e) => this.onSubjectSelect(e));
        document.getElementById('generate-pdf-btn').addEventListener('click', () => this.generateSubjectPDF());
        document.getElementById('print-report-btn').addEventListener('click', () => this.printSubjectReport());
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageEl = document.getElementById('notification-message');
        
        notification.className = `notification ${type}`;
        messageEl.textContent = message;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
    
    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!username || !password) {
            this.showNotification('Por favor, complete todos los campos', 'error');
            return;
        }
        
        const teacher = this.teachers.find(t => t.username === username && t.password === password);
        
        if (teacher) {
            this.currentTeacher = teacher;
            this.showMainScreen();
            this.showNotification(`¡Bienvenido, ${teacher.name}!`, 'success');
        } else {
            this.showNotification('Usuario o contraseña incorrectos', 'error');
        }
    }
    
    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-password-confirm').value;
        
        // Validaciones
        if (!name || !username || !password || !confirmPassword) {
            this.showNotification('Por favor, complete todos los campos', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showNotification('Las contraseñas no coinciden', 'error');
            return;
        }
        
        if (this.teachers.some(t => t.username === username)) {
            this.showNotification('El usuario ya existe', 'error');
            return;
        }
        
        // Crear nuevo docente
        const newTeacher = {
            id: Date.now(),
            name,
            username,
            password
        };
        
        this.teachers.push(newTeacher);
        this.showNotification('Cuenta creada exitosamente', 'success');
        
        // Limpiar formulario y volver al login
        document.getElementById('register-form').reset();
        setTimeout(() => {
            this.showScreen('login-screen');
        }, 1000);
    }
    
    showMainScreen() {
        this.showScreen('main-screen');
        document.getElementById('teacher-name').textContent = `Profesor: ${this.currentTeacher.name}`;
        this.updateUI();
    }
    
    handleLogout() {
        this.currentTeacher = null;
        this.students = [];
        this.subjects = [];
        this.grades = {};
        document.getElementById('login-form').reset();
        this.showScreen('login-screen');
        this.showNotification('Sesión cerrada', 'info');
    }
    
    switchTab(tabId) {
        // Actualizar tabs activos
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        // Mostrar contenido correspondiente
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.classList.add('hidden');
        });
        document.getElementById(`${tabId}-tab`).classList.remove('hidden');
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        // Actualizar datos específicos del tab - CRÍTICO: Forzar actualización para reportes
        if (tabId === 'reports') {
            // Forzar actualización completa del tab de reportes
            setTimeout(() => {
                this.updateSubjectSelector();
                this.updateReportPreview();
                this.updateSubjectStats();
            }, 100);
        }
    }
    
    addStudent(e) {
        e.preventDefault();
        const name = document.getElementById('student-name').value.trim();
        
        if (!name) {
            this.showNotification('Ingrese el nombre del estudiante', 'error');
            return;
        }
        
        if (this.students.includes(name)) {
            this.showNotification('El estudiante ya existe', 'error');
            return;
        }
        
        this.students.push(name);
        document.getElementById('student-name').value = '';
        this.updateUI();
        this.showNotification('Estudiante agregado', 'success');
    }
    
    addSubject(e) {
        e.preventDefault();
        const name = document.getElementById('subject-name').value.trim();
        
        if (!name) {
            this.showNotification('Ingrese el nombre de la materia', 'error');
            return;
        }
        
        if (this.subjects.includes(name)) {
            this.showNotification('La materia ya existe', 'error');
            return;
        }
        
        this.subjects.push(name);
        document.getElementById('subject-name').value = '';
        this.updateUI();
        // Forzar actualización inmediata del selector de materias
        this.updateSubjectSelector();
        this.showNotification('Materia agregada', 'success');
    }
    
    removeStudent(index) {
        if (confirm(`¿Está seguro de eliminar al estudiante "${this.students[index]}"?`)) {
            const studentName = this.students[index];
            this.students.splice(index, 1);
            
            // Limpiar calificaciones del estudiante eliminado
            delete this.grades[index];
            
            // Reindexar calificaciones
            const newGrades = {};
            Object.keys(this.grades).forEach(studentIdx => {
                const numIdx = parseInt(studentIdx);
                if (numIdx > index) {
                    newGrades[numIdx - 1] = this.grades[studentIdx];
                } else {
                    newGrades[numIdx] = this.grades[studentIdx];
                }
            });
            this.grades = newGrades;
            
            this.updateUI();
            this.showNotification(`Estudiante "${studentName}" eliminado`, 'success');
        }
    }
    
    removeSubject(index) {
        if (confirm(`¿Está seguro de eliminar la materia "${this.subjects[index]}"?`)) {
            const subjectName = this.subjects[index];
            this.subjects.splice(index, 1);
            
            // Limpiar calificaciones de la materia eliminada
            Object.keys(this.grades).forEach(studentIdx => {
                if (this.grades[studentIdx]) {
                    delete this.grades[studentIdx][index];
                    
                    // Reindexar materias
                    const newSubjectGrades = {};
                    Object.keys(this.grades[studentIdx]).forEach(subjectIdx => {
                        const numIdx = parseInt(subjectIdx);
                        if (numIdx > index) {
                            newSubjectGrades[numIdx - 1] = this.grades[studentIdx][subjectIdx];
                        } else {
                            newSubjectGrades[numIdx] = this.grades[studentIdx][subjectIdx];
                        }
                    });
                    this.grades[studentIdx] = newSubjectGrades;
                }
            });
            
            this.updateUI();
            // Actualizar selector de materias después de eliminar
            this.updateSubjectSelector();
            this.showNotification(`Materia "${subjectName}" eliminada`, 'success');
        }
    }
    
    updateUI() {
        this.renderStudents();
        this.renderSubjects();
        this.renderGradesMatrix();
        // Asegurar que el selector siempre se actualice
        this.updateSubjectSelector();
        this.updateReportPreview();
        this.updateSubjectStats();
    }
    
    renderStudents() {
        const container = document.getElementById('students-list');
        const counter = document.getElementById('students-count');
        
        counter.textContent = `${this.students.length} estudiante${this.students.length !== 1 ? 's' : ''}`;
        
        if (this.students.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No hay estudiantes registrados</p></div>';
            return;
        }
        
        container.innerHTML = this.students.map((student, index) => `
            <div class="item-row">
                <div class="flex items-center">
                    <span class="item-number">${index + 1}</span>
                    <span class="item-name">${student}</span>
                </div>
                <div class="item-actions">
                    <button class="btn-delete" onclick="gradingSystem.removeStudent(${index})">
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderSubjects() {
        const container = document.getElementById('subjects-list');
        const counter = document.getElementById('subjects-count');
        
        counter.textContent = `${this.subjects.length} materia${this.subjects.length !== 1 ? 's' : ''}`;
        
        if (this.subjects.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No hay materias registradas</p></div>';
            return;
        }
        
        container.innerHTML = this.subjects.map((subject, index) => `
            <div class="item-row">
                <div class="flex items-center">
                    <span class="item-number">${index + 1}</span>
                    <span class="item-name">${subject}</span>
                </div>
                <div class="item-actions">
                    <button class="btn-delete" onclick="gradingSystem.removeSubject(${index})">
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    renderGradesMatrix() {
        const container = document.getElementById('grades-matrix');
        
        if (this.students.length === 0 || this.subjects.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Agrega estudiantes y materias para comenzar a calificar</p></div>';
            return;
        }
        
        let html = `
            <table class="grades-table">
                <thead>
                    <tr>
                        <th class="student-name">Estudiante</th>
                        ${this.subjects.map(subject => `
                            <th colspan="5">${subject}</th>
                        `).join('')}
                    </tr>
                    <tr>
                        <th class="student-name"></th>
                        ${this.subjects.map(() => `
                            <th>P1</th>
                            <th>P2</th>
                            <th>P3</th>
                            <th>Promedio</th>
                            <th>Estatus</th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
        `;
        
        this.students.forEach((student, studentIndex) => {
            html += `<tr>`;
            html += `<td class="student-name"><strong>${studentIndex + 1}. ${student}</strong></td>`;
            
            this.subjects.forEach((subject, subjectIndex) => {
                const gradeData = this.getGradeData(studentIndex, subjectIndex);
                const status = this.calculateStatus(gradeData.parcial1, gradeData.parcial2, gradeData.parcial3);
                const average = this.calculateAverage(gradeData.parcial1, gradeData.parcial2, gradeData.parcial3);
                
                html += `
                    <td class="grade-cell">
                        <input type="number" min="0" max="10" step="0.1" 
                               class="grade-input" 
                               value="${gradeData.parcial1 !== null && gradeData.parcial1 !== undefined ? gradeData.parcial1 : ''}" 
                               onchange="gradingSystem.updateGrade(${studentIndex}, ${subjectIndex}, 'parcial1', this.value)">
                    </td>
                    <td class="grade-cell">
                        <input type="number" min="0" max="10" step="0.1" 
                               class="grade-input" 
                               value="${gradeData.parcial2 !== null && gradeData.parcial2 !== undefined ? gradeData.parcial2 : ''}" 
                               onchange="gradingSystem.updateGrade(${studentIndex}, ${subjectIndex}, 'parcial2', this.value)">
                    </td>
                    <td class="grade-cell">
                        <input type="number" min="0" max="10" step="0.1" 
                               class="grade-input" 
                               value="${gradeData.parcial3 !== null && gradeData.parcial3 !== undefined ? gradeData.parcial3 : ''}" 
                               onchange="gradingSystem.updateGrade(${studentIndex}, ${subjectIndex}, 'parcial3', this.value)">
                    </td>
                    <td class="grade-average">${average}</td>
                    <td class="grade-status status-${this.getStatusClass(status)}">${status}</td>
                `;
            });
            
            html += `</tr>`;
        });
        
        html += `</tbody></table>`;
        container.innerHTML = html;
    }
    
    getGradeData(studentIndex, subjectIndex) {
        if (!this.grades[studentIndex]) {
            this.grades[studentIndex] = {};
        }
        if (!this.grades[studentIndex][subjectIndex]) {
            this.grades[studentIndex][subjectIndex] = {
                parcial1: null,
                parcial2: null,
                parcial3: null
            };
        }
        return this.grades[studentIndex][subjectIndex];
    }
    
    updateGrade(studentIndex, subjectIndex, parcial, value) {
        const gradeData = this.getGradeData(studentIndex, subjectIndex);
        gradeData[parcial] = value && value.trim() !== '' ? parseFloat(value) : null;
        
        this.updateGradeCells(studentIndex, subjectIndex);
        this.updateReportPreview();
        this.updateSubjectStats();
    }
    
    updateGradeCells(studentIndex, subjectIndex) {
        const gradeData = this.getGradeData(studentIndex, subjectIndex);
        const status = this.calculateStatus(gradeData.parcial1, gradeData.parcial2, gradeData.parcial3);
        const average = this.calculateAverage(gradeData.parcial1, gradeData.parcial2, gradeData.parcial3);
        
        const table = document.querySelector('.grades-table');
        if (table) {
            const rows = table.querySelectorAll('tbody tr');
            const targetRow = rows[studentIndex];
            if (targetRow) {
                const cells = targetRow.querySelectorAll('td');
                const cellsPerSubject = 5;
                const baseIndex = 1;
                const subjectOffset = subjectIndex * cellsPerSubject;
                
                const averageCell = cells[baseIndex + subjectOffset + 3];
                if (averageCell) {
                    averageCell.textContent = average;
                }
                
                const statusCell = cells[baseIndex + subjectOffset + 4];
                if (statusCell) {
                    statusCell.textContent = status;
                    statusCell.className = `grade-status status-${this.getStatusClass(status)}`;
                }
            }
        }
    }
    
    getStatusClass(status) {
        switch(status) {
            case this.statusTypes.approved:
                return 'aprobado';
            case this.statusTypes.extraordinary:
                return 'extraordinario';
            case this.statusTypes.failed:
                return 'reprobado';
            default:
                return '';
        }
    }
    
    calculateAverage(p1, p2, p3) {
        const grades = [p1, p2, p3].filter(g => g !== null && g !== undefined);
        if (grades.length === 0) return '-';
        return (grades.reduce((sum, g) => sum + parseFloat(g), 0) / grades.length).toFixed(1);
    }
    
    calculateStatus(p1, p2, p3) {
        if (p1 === null || p1 === undefined ||
            p2 === null || p2 === undefined ||
            p3 === null || p3 === undefined) {
            return '-';
        }
        
        const parciales = [parseFloat(p1), parseFloat(p2), parseFloat(p3)];
        const suma = parciales.reduce((sum, p) => sum + p, 0);
        const reprobados = parciales.filter(p => p < this.rules.passingGrade).length;
        
        // Extraordinario si reprueba 2 o más parciales O suma = 17
        if (reprobados >= 2 || suma === this.rules.extraordinaryTotal) {
            return this.statusTypes.extraordinary;
        }
        
        // Aprobado si reprueba máximo 1 parcial Y suma >= 18
        if (reprobados <= this.rules.maxFailedPartialsToPass && suma >= this.rules.minTotalToPass) {
            return this.statusTypes.approved;
        }
        
        return this.statusTypes.failed;
    }
    
    // Funcionalidad de Reportes por Materia
    updateSubjectSelector() {
        const selector = document.getElementById('subject-selector');
        if (!selector) return; // Verificar que el elemento existe
        
        const generateBtn = document.getElementById('generate-pdf-btn');
        const printBtn = document.getElementById('print-report-btn');
        
        // Limpiar selector completamente
        selector.innerHTML = '';
        
        // Agregar opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- Seleccione una materia --';
        selector.appendChild(defaultOption);
        
        // Agregar todas las materias disponibles
        this.subjects.forEach((subject, index) => {
            const option = document.createElement('option');
            option.value = index.toString();
            option.textContent = subject;
            selector.appendChild(option);
        });
        
        // Actualizar estado de botones
        const hasSelection = selector.value !== '';
        if (generateBtn) generateBtn.disabled = !hasSelection;
        if (printBtn) printBtn.disabled = !hasSelection;
        
        // Debug: Verificar que las materias se agregaron
        console.log('Subjects available:', this.subjects);
        console.log('Selector options count:', selector.options.length);
    }
    
    onSubjectSelect(e) {
        const subjectIndex = e.target.value;
        const generateBtn = document.getElementById('generate-pdf-btn');
        const printBtn = document.getElementById('print-report-btn');
        
        if (subjectIndex === '') {
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = '📊 Generar Reporte PDF';
            }
            if (printBtn) {
                printBtn.disabled = true;
                printBtn.textContent = '🖨️ Imprimir Reporte';
            }
        } else {
            const subjectName = this.subjects[subjectIndex];
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.textContent = `📊 Generar Reporte de ${subjectName}`;
            }
            if (printBtn) {
                printBtn.disabled = false;
                printBtn.textContent = `🖨️ Imprimir ${subjectName}`;
            }
        }
        
        this.updateReportPreview();
        this.updateSubjectStats();
    }
    
    updateReportPreview() {
        const selector = document.getElementById('subject-selector');
        const preview = document.getElementById('report-preview');
        
        if (!selector || !preview) return;
        
        const subjectIndex = selector.value;
        
        if (subjectIndex === '' || !this.subjects[subjectIndex]) {
            preview.innerHTML = `
                <div class="empty-preview">
                    <p>Seleccione una materia para ver la vista previa del reporte</p>
                </div>
            `;
            return;
        }
        
        const subjectName = this.subjects[subjectIndex];
        const subjectData = this.getSubjectData(parseInt(subjectIndex));
        
        let previewHTML = `
            <div class="report-preview-content">
                <div class="preview-title">REPORTE DE CALIFICACIONES</div>
                <div class="preview-subject">${subjectName}</div>
                <p><strong>Docente:</strong> ${this.currentTeacher.name}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                <p><strong>Total de estudiantes:</strong> ${subjectData.length}</p>
        `;
        
        if (subjectData.length > 0) {
            previewHTML += `
                <table class="preview-table">
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th class="student-col">Estudiante</th>
                            <th>P1</th>
                            <th>P2</th>
                            <th>P3</th>
                            <th>Promedio</th>
                            <th>Estatus</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            subjectData.forEach((student, index) => {
                const statusClass = this.getStatusClass(student.status);
                previewHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td class="student-col">${student.name}</td>
                        <td>${student.parcial1 !== null ? student.parcial1 : '-'}</td>
                        <td>${student.parcial2 !== null ? student.parcial2 : '-'}</td>
                        <td>${student.parcial3 !== null ? student.parcial3 : '-'}</td>
                        <td>${student.average}</td>
                        <td class="status-${statusClass}">${student.status}</td>
                    </tr>
                `;
            });
            
            previewHTML += `
                    </tbody>
                </table>
            `;
        } else {
            previewHTML += '<p class="text-center">No hay calificaciones registradas para esta materia</p>';
        }
        
        previewHTML += '</div>';
        preview.innerHTML = previewHTML;
    }
    
    updateSubjectStats() {
        const selector = document.getElementById('subject-selector');
        
        if (!selector) return;
        
        const subjectIndex = selector.value;
        
        const totalEl = document.getElementById('total-students-stat');
        const approvedEl = document.getElementById('approved-students-stat');
        const extraordinaryEl = document.getElementById('extraordinary-students-stat');
        const failedEl = document.getElementById('failed-students-stat');
        
        if (subjectIndex === '' || !this.subjects[subjectIndex]) {
            if (totalEl) totalEl.textContent = '-';
            if (approvedEl) approvedEl.textContent = '-';
            if (extraordinaryEl) extraordinaryEl.textContent = '-';
            if (failedEl) failedEl.textContent = '-';
            return;
        }
        
        const subjectData = this.getSubjectData(parseInt(subjectIndex));
        const stats = this.calculateSubjectStats(subjectData);
        
        if (totalEl) totalEl.textContent = stats.total;
        if (approvedEl) approvedEl.textContent = `${stats.approved} (${stats.approvedPercent}%)`;
        if (extraordinaryEl) extraordinaryEl.textContent = `${stats.extraordinary} (${stats.extraordinaryPercent}%)`;
        if (failedEl) failedEl.textContent = `${stats.failed} (${stats.failedPercent}%)`;
    }
    
    getSubjectData(subjectIndex) {
        const subjectData = [];
        
        this.students.forEach((studentName, studentIndex) => {
            const gradeData = this.getGradeData(studentIndex, subjectIndex);
            const average = this.calculateAverage(gradeData.parcial1, gradeData.parcial2, gradeData.parcial3);
            const status = this.calculateStatus(gradeData.parcial1, gradeData.parcial2, gradeData.parcial3);
            
            subjectData.push({
                name: studentName,
                parcial1: gradeData.parcial1,
                parcial2: gradeData.parcial2,
                parcial3: gradeData.parcial3,
                average: average,
                status: status
            });
        });
        
        return subjectData;
    }
    
    calculateSubjectStats(subjectData) {
        const total = subjectData.length;
        const approved = subjectData.filter(s => s.status === this.statusTypes.approved).length;
        const extraordinary = subjectData.filter(s => s.status === this.statusTypes.extraordinary).length;
        const failed = subjectData.filter(s => s.status === this.statusTypes.failed).length;
        
        return {
            total,
            approved,
            extraordinary,
            failed,
            approvedPercent: total > 0 ? Math.round((approved / total) * 100) : 0,
            extraordinaryPercent: total > 0 ? Math.round((extraordinary / total) * 100) : 0,
            failedPercent: total > 0 ? Math.round((failed / total) * 100) : 0
        };
    }
    
    generateSubjectPDF() {
        const selector = document.getElementById('subject-selector');
        const subjectIndex = parseInt(selector.value);
        
        if (isNaN(subjectIndex) || !this.subjects[subjectIndex]) {
            this.showNotification('Seleccione una materia válida para generar el reporte', 'error');
            return;
        }
        
        const subjectName = this.subjects[subjectIndex];
        const subjectData = this.getSubjectData(subjectIndex);
        
        if (subjectData.length === 0) {
            this.showNotification('No hay estudiantes registrados para generar el reporte', 'warning');
            return;
        }
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Configuración del documento
            doc.setFont("helvetica");
            let yPosition = 20;
            
            // Título principal
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("REPORTE DE CALIFICACIONES", 105, yPosition, { align: 'center' });
            yPosition += 10;
            
            // Materia
            doc.setFontSize(14);
            doc.text(`MATERIA: ${subjectName}`, 105, yPosition, { align: 'center' });
            yPosition += 15;
            
            // Información del docente y fecha
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Docente: ${this.currentTeacher.name}`, 20, yPosition);
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 150, yPosition);
            yPosition += 15;
            
            // Encabezados de tabla
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text("No.", 20, yPosition);
            doc.text("Estudiante", 35, yPosition);
            doc.text("P1", 100, yPosition);
            doc.text("P2", 115, yPosition);
            doc.text("P3", 130, yPosition);
            doc.text("Prom.", 145, yPosition);
            doc.text("Estatus", 165, yPosition);
            yPosition += 5;
            
            // Línea separadora
            doc.line(20, yPosition, 190, yPosition);
            yPosition += 5;
            
            // Datos de estudiantes
            doc.setFont("helvetica", "normal");
            subjectData.forEach((student, index) => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.text(`${index + 1}`, 20, yPosition);
                doc.text(student.name.substring(0, 25), 35, yPosition);
                doc.text(student.parcial1 !== null ? student.parcial1.toString() : '-', 100, yPosition);
                doc.text(student.parcial2 !== null ? student.parcial2.toString() : '-', 115, yPosition);
                doc.text(student.parcial3 !== null ? student.parcial3.toString() : '-', 130, yPosition);
                doc.text(student.average, 145, yPosition);
                doc.text(student.status, 165, yPosition);
                yPosition += 7;
            });
            
            // Estadísticas
            yPosition += 10;
            const stats = this.calculateSubjectStats(subjectData);
            
            doc.setFont("helvetica", "bold");
            doc.text("ESTADÍSTICAS DE LA MATERIA:", 20, yPosition);
            yPosition += 10;
            
            doc.setFont("helvetica", "normal");
            doc.text(`Total de estudiantes: ${stats.total}`, 20, yPosition);
            yPosition += 5;
            doc.text(`Aprobados: ${stats.approved} (${stats.approvedPercent}%)`, 20, yPosition);
            yPosition += 5;
            doc.text(`Extraordinario: ${stats.extraordinary} (${stats.extraordinaryPercent}%)`, 20, yPosition);
            yPosition += 5;
            doc.text(`Reprobados: ${stats.failed} (${stats.failedPercent}%)`, 20, yPosition);
            
            // Generar nombre del archivo
            const fileName = `Reporte_${subjectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
            
            // Descargar
            doc.save(fileName);
            this.showNotification(`Reporte de ${subjectName} generado exitosamente`, 'success');
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            this.showNotification('Error al generar el PDF', 'error');
        }
    }
    
    printSubjectReport() {
        const selector = document.getElementById('subject-selector');
        const subjectIndex = parseInt(selector.value);
        
        if (isNaN(subjectIndex) || !this.subjects[subjectIndex]) {
            this.showNotification('Seleccione una materia válida para imprimir', 'error');
            return;
        }
        
        const subjectName = this.subjects[subjectIndex];
        const subjectData = this.getSubjectData(subjectIndex);
        
        if (subjectData.length === 0) {
            this.showNotification('No hay estudiantes registrados para imprimir el reporte', 'warning');
            return;
        }
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Generar el mismo PDF que el método anterior
            doc.setFont("helvetica");
            let yPosition = 20;
            
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("REPORTE DE CALIFICACIONES", 105, yPosition, { align: 'center' });
            yPosition += 10;
            
            doc.setFontSize(14);
            doc.text(`MATERIA: ${subjectName}`, 105, yPosition, { align: 'center' });
            yPosition += 15;
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Docente: ${this.currentTeacher.name}`, 20, yPosition);
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 150, yPosition);
            yPosition += 15;
            
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text("No.", 20, yPosition);
            doc.text("Estudiante", 35, yPosition);
            doc.text("P1", 100, yPosition);
            doc.text("P2", 115, yPosition);
            doc.text("P3", 130, yPosition);
            doc.text("Prom.", 145, yPosition);
            doc.text("Estatus", 165, yPosition);
            yPosition += 5;
            
            doc.line(20, yPosition, 190, yPosition);
            yPosition += 5;
            
            doc.setFont("helvetica", "normal");
            subjectData.forEach((student, index) => {
                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.text(`${index + 1}`, 20, yPosition);
                doc.text(student.name.substring(0, 25), 35, yPosition);
                doc.text(student.parcial1 !== null ? student.parcial1.toString() : '-', 100, yPosition);
                doc.text(student.parcial2 !== null ? student.parcial2.toString() : '-', 115, yPosition);
                doc.text(student.parcial3 !== null ? student.parcial3.toString() : '-', 130, yPosition);
                doc.text(student.average, 145, yPosition);
                doc.text(student.status, 165, yPosition);
                yPosition += 7;
            });
            
            yPosition += 10;
            const stats = this.calculateSubjectStats(subjectData);
            
            doc.setFont("helvetica", "bold");
            doc.text("ESTADÍSTICAS DE LA MATERIA:", 20, yPosition);
            yPosition += 10;
            
            doc.setFont("helvetica", "normal");
            doc.text(`Total de estudiantes: ${stats.total}`, 20, yPosition);
            yPosition += 5;
            doc.text(`Aprobados: ${stats.approved} (${stats.approvedPercent}%)`, 20, yPosition);
            yPosition += 5;
            doc.text(`Extraordinario: ${stats.extraordinary} (${stats.extraordinaryPercent}%)`, 20, yPosition);
            yPosition += 5;
            doc.text(`Reprobados: ${stats.failed} (${stats.failedPercent}%)`, 20, yPosition);
            
            // Abrir diálogo de impresión
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const printWindow = window.open(pdfUrl);
            
            if (printWindow) {
                printWindow.onload = function() {
                    printWindow.print();
                };
            } else {
                // Si el popup fue bloqueado, generar el PDF normalmente
                const fileName = `Reporte_${subjectName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
                doc.save(fileName);
            }
            
            this.showNotification(`Preparando impresión de ${subjectName}`, 'success');
            
        } catch (error) {
            console.error('Error preparando impresión:', error);
            this.showNotification('Error al preparar la impresión', 'error');
        }
    }
}

// Inicializar el sistema cuando se carga la página
let gradingSystem;
document.addEventListener('DOMContentLoaded', () => {
    gradingSystem = new GradingSystem();
});