// app.js

const app = {
    csvData: [],
    leads: [],
    currentTab: "open",

    handleCSVUpload: async function (event) {
        const file = event.target.files[0];
        if (!file) return;

        const text = await file.text();
        this.parseCSV(text);
        this.processLeads();
    },

    parseCSV: function (text) {
        const [headerLine, ...lines] = text.split(/\r?\n/).filter(l => l.trim() !== "");
        const headers = headerLine.split(",").map(h => h.trim());

        this.csvData = lines.map(line => {
            const values = line.split(",").map(v => v.trim());
            const obj = {};
            headers.forEach((h, i) => obj[h] = values[i] || "");
            return obj;
        });
    },

    processLeads: async function () {
        if (!this.csvData.length) return;

        document.getElementById("loadingState").style.display = "block";
        document.getElementById("emptyState").style.display = "none";

        this.leads = [];
        let processedCount = 0;

        for (const row of this.csvData) {
            const businessName = row["Business Name"] || "Unnamed";
            const website = row["Website"];
            const address = `${row["Address"] || ""}, ${row["City, State"] || ""}`;

            // Skip if no website
            if (!website) continue;

            const status = await this.checkWebsiteStatus(website);

            const lead = {
                businessName,
                website,
                address,
                status,
                email: "",
                contacted: false,
                closed: false,
            };

            this.leads.push(lead);

            processedCount++;
            const progress = Math.floor((processedCount / this.csvData.length) * 100);
            document.getElementById("progressFill").style.width = progress + "%";
            document.getElementById("progressText").textContent = `${processedCount} / ${this.csvData.length}`;
        }

        document.getElementById("loadingState").style.display = "none";
        this.renderLeads();
        this.updateStats();
    },

    checkWebsiteStatus: async function (website) {
        try {
            const response = await fetch(`/api/checkWebsite?url=${encodeURIComponent(website)}`);
            const data = await response.json();
            return data.status; // "up" or "down"
        } catch (err) {
            return "down";
        }
    },

    renderLeads: function () {
        const container = document.getElementById("leadsList");
        container.innerHTML = "";

        this.leads.forEach((lead, index) => {
            const div = document.createElement("div");
            div.className = "lead-item";

            div.innerHTML = `
                <div class="lead-header">
                    <strong>${lead.businessName}</strong>
                    <span>${lead.address}</span>
                    <span>Website: <a href="${lead.website}" target="_blank">${lead.website}</a></span>
                    <span>Status: <strong>${lead.status}</strong></span>
                </div>
                <div class="lead-actions">
                    <button onclick="app.promptEmail(${index})">Has Email</button>
                    <button onclick="app.toggleContacted(${index})">${lead.contacted ? "Uncontacted" : "Contacted"}</button>
                    <button onclick="app.toggleClosed(${index})">${lead.closed ? "Reopen" : "Closed"}</button>
                </div>
            `;

            container.appendChild(div);
        });
    },

    promptEmail: function (index) {
        const email = prompt("Enter the email for " + this.leads[index].businessName);
        if (email) {
            this.leads[index].email = email;
            this.updateStats();
        }
    },

    toggleContacted: function (index) {
        this.leads[index].contacted = !this.leads[index].contacted;
        this.renderLeads();
        this.updateStats();
    },

    toggleClosed: function (index) {
        this.leads[index].closed = !this.leads[index].closed;
        this.renderLeads();
        this.updateStats();
    },

    updateStats: function () {
        const total = this.leads.length;
        const open = this.leads.filter(l => !l.closed).length;
        const contacted = this.leads.filter(l => l.contacted).length;
        const emailFound = this.leads.filter(l => l.email).length;
        const noEmail = this.leads.filter(l => !l.email).length;
        const closed = this.leads.filter(l => l.closed).length;

        document.getElementById("totalLeads").textContent = total;
        document.getElementById("openLeads").textContent = open;
        document.getElementById("contactedCount").textContent = contacted;
        document.getElementById("emailFoundCount").textContent = emailFound;
        document.getElementById("noEmailCount").textContent = noEmail;
        document.getElementById("closedCount").textContent = closed;

        document.getElementById("openBadge").textContent = open;
        document.getElementById("contactedBadge").textContent = contacted;
        document.getElementById("emailFoundBadge").textContent = emailFound;
        document.getElementById("noEmailBadge").textContent = noEmail;
        document.getElementById("closedBadge").textContent = closed;
    },

    exportToExcel: function () {
        const headers = ["Business Name", "Address", "Website", "Status", "Email", "Contacted", "Closed"];
        const rows = this.leads.map(l => [
            l.businessName,
            l.address,
            l.website,
            l.status,
            l.email,
            l.contacted ? "Yes" : "No",
            l.closed ? "Yes" : "No"
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "leads_export.csv";
        link.click();
    }
};

// Tab switching
document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        app.currentTab = tab.dataset.tab;
    });
});
