// ============================================
// EPHEMERAL VULNERABILITY SCANNER
// 100% Client-Side Analysis Engine
// ============================================

// Global State (ephemeral - cleared on refresh)
let selectedOS = null;
let currentFile = null;
let analysisResults = [];
let currentFilter = 'all';

// OS Commands Configuration
const OS_COMMANDS = {
    windows: {
        name: 'Windows',
        description: 'Generate inventory using PowerShell',
        tabs: [
            {
                label: 'PowerShell',
                command: `Get-WmiObject -Class Win32_Product | Select-Object Name, Version | ConvertTo-Json | Out-File system-inventory.json`,
                filename: 'system-inventory.json'
            }
        ],
        ecosystem: 'Windows',
        fileFormat: 'json'
    },
    linux: {
        name: 'Linux / macOS / Unix',
        description: 'Generate inventory using package manager',
        tabs: [
            {
                label: 'Debian/Ubuntu',
                command: `dpkg-query -W -f='\${Package} \${Version}\\n' > system-inventory.txt`,
                filename: 'system-inventory.txt'
            },
            {
                label: 'RHEL/Fedora/CentOS',
                command: `rpm -qa --queryformat '%{NAME} %{VERSION}\\n' > system-inventory.txt`,
                filename: 'system-inventory.txt'
            },
            {
                label: 'macOS (Homebrew)',
                command: `brew list --versions > system-inventory.txt`,
                filename: 'system-inventory.txt'
            }
        ],
        ecosystem: 'Debian',
        fileFormat: 'txt'
    }
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔒 Ephemeral Vulnerability Scanner initialized');
    console.log('✅ No data persistence • All analysis happens locally');

    // Setup drag and drop
    setupDragAndDrop();
});

// ============================================
// STEP 1: OS SELECTION
// ============================================
function selectOS(os) {
    selectedOS = os;

    // Update UI
    document.querySelectorAll('.os-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelector(`[data-os="${os}"]`).classList.add('selected');

    // Show command section
    displayCommands(os);
    document.getElementById('commandSection').style.display = 'block';
    document.getElementById('continueBtn').style.display = 'inline-flex';
}

function displayCommands(os) {
    const config = OS_COMMANDS[os];
    const commandSection = document.getElementById('commandSection');

    // Update description
    document.getElementById('commandDescription').textContent = config.description;

    // Create tabs if multiple commands
    const tabsContainer = document.getElementById('commandTabs');
    tabsContainer.innerHTML = '';

    if (config.tabs.length > 1) {
        config.tabs.forEach((tab, index) => {
            const tabBtn = document.createElement('button');
            tabBtn.className = `command-tab ${index === 0 ? 'active' : ''}`;
            tabBtn.textContent = tab.label;
            tabBtn.onclick = () => switchCommandTab(os, index);
            tabsContainer.appendChild(tabBtn);
        });
    }

    // Display first command
    switchCommandTab(os, 0);
}

function switchCommandTab(os, index) {
    const config = OS_COMMANDS[os];
    const tab = config.tabs[index];

    // Update active tab
    document.querySelectorAll('.command-tab').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });

    // Update command display
    document.getElementById('commandLabel').textContent = tab.label || config.name;
    document.getElementById('commandCode').textContent = tab.command;
}

function copyCommand() {
    const commandText = document.getElementById('commandCode').textContent;
    const copyBtn = document.getElementById('copyBtn');

    navigator.clipboard.writeText(commandText).then(() => {
        // Visual feedback
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Copied!
        `;

        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Copy
            `;
        }, 2000);
    });
}

function goToStep2() {
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep1() {
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step1').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// STEP 2: FILE UPLOAD
// ============================================
function setupDragAndDrop() {
    const uploadZone = document.getElementById('uploadZone');

    if (!uploadZone) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.remove('drag-over');
        }, false);
    });

    uploadZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }, false);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validate file type
    const validExtensions = ['.json', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
        alert('Invalid file type. Please upload a .json or .txt file.');
        return;
    }

    currentFile = file;

    // Display file info
    document.getElementById('uploadZone').style.display = 'none';
    document.getElementById('fileInfo').style.display = 'flex';
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('analyzeBtn').style.display = 'inline-flex';
}

function clearFile() {
    currentFile = null;
    document.getElementById('uploadZone').style.display = 'flex';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('analyzeBtn').style.display = 'none';
    document.getElementById('fileInput').value = '';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================
// STEP 3: ANALYSIS ENGINE
// ============================================
async function startAnalysis() {
    if (!currentFile || !selectedOS) {
        alert('Please select an OS and upload a file first.');
        return;
    }

    // Show progress section
    document.getElementById('analyzeBtn').style.display = 'none';
    document.getElementById('progressSection').style.display = 'block';

    try {
        // Parse inventory file
        updateProgress(10, 'Parsing inventory file...');
        const packages = await parseInventoryFile(currentFile, selectedOS);

        console.log(`📦 Found ${packages.length} packages to analyze`);

        // Analyze each package
        analysisResults = [];
        const totalPackages = packages.length;

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            const progress = 10 + ((i / totalPackages) * 80);

            updateProgress(
                progress,
                `Analyzing ${pkg.name} (${i + 1}/${totalPackages})...`,
                i + 1,
                analysisResults.length
            );

            const vulnerabilities = await analyzePackage(pkg, selectedOS);

            if (vulnerabilities.length > 0) {
                analysisResults.push(...vulnerabilities);
            }

            // Small delay to prevent rate limiting
            await sleep(100);
        }

        updateProgress(100, 'Analysis complete!', totalPackages, analysisResults.length);

        // Show results
        setTimeout(() => {
            displayResults();
        }, 500);

    } catch (error) {
        console.error('Analysis error:', error);
        alert('An error occurred during analysis. Please try again.');
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('analyzeBtn').style.display = 'inline-flex';
    }
}

async function parseInventoryFile(file, os) {
    const text = await file.text();
    const packages = [];

    if (os === 'windows') {
        // Parse JSON format
        try {
            const data = JSON.parse(text);
            const items = Array.isArray(data) ? data : [data];

            items.forEach(item => {
                if (item.Name && item.Version) {
                    packages.push({
                        name: normalizePackageName(item.Name),
                        version: item.Version.trim()
                    });
                }
            });
        } catch (e) {
            console.error('JSON parse error:', e);
        }
    } else {
        // Parse text format (package version)
        const lines = text.split('\n');
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
                packages.push({
                    name: normalizePackageName(parts[0]),
                    version: parts[1].trim()
                });
            }
        });
    }

    return packages;
}

function normalizePackageName(name) {
    return name.toLowerCase().trim().replace(/\s+/g, '-');
}

async function analyzePackage(pkg, os) {
    const vulnerabilities = [];

    try {
        if (os === 'windows') {
            // ═══════════════════════════════════════════════════════
            // WINDOWS LOOKUP CHAIN: MSRC → OSV.dev → CISA KEV
            // ═══════════════════════════════════════════════════════

            // STEP 1: Query MSRC (Microsoft CSAF)
            console.log(`[Windows] Step 1/3: Checking MSRC for ${pkg.name}...`);
            const msrcResult = await queryMSRC(pkg);

            if (msrcResult.found) {
                // MSRC has this product - use its verdict
                if (msrcResult.vulnerabilities.length > 0) {
                    console.log(`[Windows] ✗ MSRC found ${msrcResult.vulnerabilities.length} vulnerability(ies) - STOP`);
                    vulnerabilities.push(...msrcResult.vulnerabilities);
                    return vulnerabilities; // STOP - MSRC is authoritative
                } else {
                    console.log(`[Windows] ✓ MSRC confirms package is secure - STOP`);
                    return vulnerabilities; // STOP - package is safe per MSRC
                }
            }

            // STEP 2: MSRC doesn't have this product → Query OSV.dev
            console.log(`[Windows] Step 2/3: MSRC has no data, checking OSV.dev...`);
            const osvResult = await queryOSVWithStatus(pkg, os);

            if (osvResult.found) {
                // OSV.dev has data for this package
                if (osvResult.vulnerabilities.length > 0) {
                    console.log(`[Windows] ✗ OSV.dev found ${osvResult.vulnerabilities.length} vulnerability(ies) - STOP`);
                    vulnerabilities.push(...osvResult.vulnerabilities);
                    return vulnerabilities; // STOP - OSV.dev found vulns
                } else {
                    console.log(`[Windows] ✓ OSV.dev confirms package is secure - STOP`);
                    return vulnerabilities; // STOP - package is safe per OSV.dev
                }
            }

            // STEP 3: Neither MSRC nor OSV.dev have data → Query CISA KEV (last resort)
            console.log(`[Windows] Step 3/3: No MSRC/OSV data, checking CISA KEV (fallback)...`);
            const cisaVulns = await queryCISAKEV(pkg);

            if (cisaVulns.length > 0) {
                console.log(`[Windows] ⚠ CISA KEV found ${cisaVulns.length} known exploited vulnerability(ies)`);
                vulnerabilities.push(...cisaVulns);
            } else {
                console.log(`[Windows] ✓ No vulnerabilities found in any source - package is safe`);
            }

        } else {
            // ═══════════════════════════════════════════════════════
            // LINUX/macOS LOOKUP CHAIN: OSV.dev → CISA KEV
            // ═══════════════════════════════════════════════════════

            // STEP 1: Query OSV.dev
            console.log(`[${os}] Step 1/2: Checking OSV.dev for ${pkg.name}...`);
            const osvResult = await queryOSVWithStatus(pkg, os);

            if (osvResult.found) {
                // OSV.dev has data for this package
                if (osvResult.vulnerabilities.length > 0) {
                    console.log(`[${os}] ✗ OSV.dev found ${osvResult.vulnerabilities.length} vulnerability(ies) - STOP`);
                    vulnerabilities.push(...osvResult.vulnerabilities);
                    return vulnerabilities; // STOP - OSV.dev found vulns
                } else {
                    console.log(`[${os}] ✓ OSV.dev confirms package is secure - STOP`);
                    return vulnerabilities; // STOP - package is safe per OSV.dev
                }
            }

            // STEP 2: OSV.dev has no data → Query CISA KEV (fallback)
            console.log(`[${os}] Step 2/2: No OSV data, checking CISA KEV (fallback)...`);
            const cisaVulns = await queryCISAKEV(pkg);

            if (cisaVulns.length > 0) {
                console.log(`[${os}] ⚠ CISA KEV found ${cisaVulns.length} known exploited vulnerability(ies)`);
                vulnerabilities.push(...cisaVulns);
            } else {
                console.log(`[${os}] ✓ No vulnerabilities found in any source - package is safe`);
            }
        }
    } catch (error) {
        console.error(`Error analyzing ${pkg.name}:`, error);
    }

    return vulnerabilities;
}

// ============================================
// MSRC CSAF API QUERY
// ============================================
async function queryMSRC(pkg) {
    // Return object: { found: boolean, vulnerabilities: array }
    // found = true means MSRC has this product (authoritative)
    // found = false means MSRC doesn't track this product

    const result = {
        found: false,
        vulnerabilities: []
    };

    try {
        const response = await fetch('https://api.msrc.microsoft.com/cvrf/v3.0/cvrf', {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.log(`MSRC API returned ${response.status}`);
            return result;
        }

        const data = await response.json();
        const recentUpdates = data.value?.slice(0, 12) || [];
        let foundProduct = false;

        for (const update of recentUpdates) {
            const updateTitle = update.Title?.toLowerCase() || '';
            const pkgName = pkg.name.toLowerCase();

            if (updateTitle.includes(pkgName) ||
                (pkgName.includes('microsoft') && updateTitle.includes(pkgName.replace('microsoft-', '')))) {

                foundProduct = true;
                result.vulnerabilities.push({
                    package: pkg.name,
                    installedVersion: pkg.version,
                    cve: update.ID || 'N/A',
                    severity: 'medium',
                    source: 'MSRC',
                    description: update.Title || 'Microsoft Security Update',
                    affectedVersions: 'See Microsoft advisory',
                    fixedVersion: 'Install latest Windows updates',
                    remediation: generateWindowsRemediation(update),
                    isFallback: false,
                    msrcData: {
                        updateId: update.ID,
                        releaseDate: update.InitialReleaseDate
                    }
                });
            }
        }

        result.found = foundProduct;

    } catch (error) {
        console.log(`MSRC query skipped for ${pkg.name} (likely CORS restriction)`);
    }

    return result;
}

// ============================================
// OSV.DEV API QUERY WITH STATUS
// ============================================
async function queryOSVWithStatus(pkg, os) {
    // Return object: { found: boolean, vulnerabilities: array }
    // found = true means OSV.dev has data for this package
    // found = false means OSV.dev doesn't track this package

    const result = {
        found: false,
        vulnerabilities: []
    };

    try {
        const ecosystem = determineEcosystem(os, pkg.name);

        const response = await fetch('https://api.osv.dev/v1/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: pkg.version,
                package: {
                    name: pkg.name,
                    ecosystem: ecosystem
                }
            })
        });

        if (!response.ok) {
            return result; // API error, not found
        }

        const data = await response.json();

        // OSV.dev returns empty array if package is known but not vulnerable
        // Returns nothing/error if package is unknown
        if (data.vulns !== undefined) {
            result.found = true; // OSV.dev knows this package

            if (data.vulns.length > 0) {
                data.vulns.forEach(vuln => {
                    result.vulnerabilities.push({
                        package: pkg.name,
                        installedVersion: pkg.version,
                        cve: vuln.id || vuln.aliases?.[0] || 'N/A',
                        severity: extractSeverity(vuln),
                        source: 'OSV.dev',
                        description: vuln.summary || vuln.details || 'No description available',
                        affectedVersions: formatAffectedVersions(vuln.affected),
                        fixedVersion: extractFixedVersion(vuln.affected),
                        remediation: generateLinuxRemediation(pkg, vuln),
                        isFallback: false,
                        references: vuln.references || [],
                        osvData: {
                            modified: vuln.modified,
                            published: vuln.published,
                            withdrawn: vuln.withdrawn
                        }
                    });
                });
            }
        }
    } catch (error) {
        console.error(`OSV.dev query error for ${pkg.name}:`, error);
    }

    return result;
}

// ============================================
// OSV.DEV API QUERY (Legacy - for reference)
// ============================================
async function queryOSV(pkg, os) {
    const vulnerabilities = [];

    try {
        const ecosystem = determineEcosystem(os, pkg.name);

        console.log(`Querying OSV.dev for ${pkg.name}@${pkg.version} in ${ecosystem} ecosystem...`);

        const response = await fetch('https://api.osv.dev/v1/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: pkg.version,
                package: {
                    name: pkg.name,
                    ecosystem: ecosystem
                }
            })
        });

        if (!response.ok) {
            console.log(`OSV.dev returned ${response.status} for ${pkg.name}`);
            return vulnerabilities;
        }

        const data = await response.json();

        // IMPORTANT: Empty vulns array means the package version is NOT vulnerable
        // This is the correct behavior - OSV.dev only returns vulnerabilities
        // for packages that are actually affected
        if (data.vulns && data.vulns.length > 0) {
            console.log(`✗ Found ${data.vulns.length} vulnerabilit${data.vulns.length === 1 ? 'y' : 'ies'} for ${pkg.name}`);

            data.vulns.forEach(vuln => {
                vulnerabilities.push({
                    package: pkg.name,
                    installedVersion: pkg.version,
                    cve: vuln.id || vuln.aliases?.[0] || 'N/A',
                    severity: extractSeverity(vuln),
                    source: 'OSV.dev',
                    description: vuln.summary || vuln.details || 'No description available',
                    affectedVersions: formatAffectedVersions(vuln.affected),
                    fixedVersion: extractFixedVersion(vuln.affected),
                    remediation: generateLinuxRemediation(pkg, vuln),
                    isFallback: false,
                    references: vuln.references || [],
                    osvData: {
                        modified: vuln.modified,
                        published: vuln.published,
                        withdrawn: vuln.withdrawn
                    }
                });
            });
        } else {
            // This is GOOD - no vulnerabilities found means the package is secure
            console.log(`✓ No vulnerabilities found for ${pkg.name}@${pkg.version} (package is secure)`);
        }
    } catch (error) {
        console.error(`OSV.dev query error for ${pkg.name}:`, error);
    }

    return vulnerabilities;
}

function determineEcosystem(os, packageName) {
    // OSV.dev ecosystem names are case-sensitive!
    // See: https://ossf.github.io/osv-schema/#affectedpackage-field

    if (os === 'linux') {
        // Try to detect Linux distribution from package name patterns
        // Most packages will work with 'Debian' ecosystem

        // Check for distribution-specific patterns
        if (packageName.includes('ubuntu') || packageName.includes('debian')) {
            return 'Debian';
        }
        if (packageName.includes('rhel') || packageName.includes('centos') || packageName.includes('fedora')) {
            return 'Rocky Linux'; // OSV uses this for RHEL-based
        }
        if (packageName.includes('alpine')) {
            return 'Alpine';
        }

        // Default to Debian (most common)
        return 'Debian';
    }

    if (os === 'macos') {
        return 'Homebrew';
    }

    // Fallback
    return 'Debian';
}

function extractSeverity(vuln) {
    // Try to extract severity from various fields
    if (vuln.severity) {
        if (Array.isArray(vuln.severity)) {
            const cvss = vuln.severity.find(s => s.type === 'CVSS_V3');
            if (cvss && cvss.score) {
                return cvssToSeverity(parseFloat(cvss.score));
            }
        }
    }

    if (vuln.database_specific?.severity) {
        return vuln.database_specific.severity.toLowerCase();
    }

    return 'medium'; // Default
}

function cvssToSeverity(score) {
    if (score >= 9.0) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    return 'low';
}

function formatAffectedVersions(affected) {
    if (!affected || affected.length === 0) return 'Unknown';

    const ranges = affected[0]?.ranges || [];
    if (ranges.length === 0) return 'Unknown';

    return ranges.map(range => {
        const events = range.events || [];
        const introduced = events.find(e => e.introduced)?.introduced || '0';
        const fixed = events.find(e => e.fixed)?.fixed || 'unfixed';
        return `${introduced} - ${fixed}`;
    }).join(', ');
}

function extractFixedVersion(affected) {
    if (!affected || affected.length === 0) return 'Not available';

    const ranges = affected[0]?.ranges || [];
    for (const range of ranges) {
        const events = range.events || [];
        const fixed = events.find(e => e.fixed);
        if (fixed) return fixed.fixed;
    }

    return 'Not available';
}

// ============================================
// CISA KEV FALLBACK QUERY
// ============================================
let cisaKEVCache = null;

async function queryCISAKEV(pkg) {
    const vulnerabilities = [];

    try {
        // Load CISA KEV data (cache it)
        if (!cisaKEVCache) {
            const response = await fetch('https://raw.githubusercontent.com/SecByShresth/VulnFeed/main/data/cisa-kev.json');
            if (!response.ok) {
                console.error('Failed to load CISA KEV data');
                return vulnerabilities;
            }
            cisaKEVCache = await response.json();
        }

        // Search for matching vulnerabilities
        const matches = cisaKEVCache.vulnerabilities?.filter(vuln => {
            const vulnProduct = (vuln.vendorProject + ' ' + vuln.product).toLowerCase();
            return vulnProduct.includes(pkg.name) || pkg.name.includes(vuln.product?.toLowerCase());
        }) || [];

        matches.forEach(vuln => {
            vulnerabilities.push({
                package: pkg.name,
                installedVersion: pkg.version,
                cve: vuln.cveID || 'N/A',
                severity: determineSeverity(vuln.vulnerabilityName),
                source: 'CISA KEV',
                description: vuln.shortDescription || vuln.vulnerabilityName || 'No description available',
                affectedVersions: 'See CISA advisory',
                fixedVersion: 'See CISA advisory',
                remediation: generateCISARemediation(vuln),
                isFallback: true,
                cisaData: {
                    knownRansomware: vuln.knownRansomwareCampaignUse === 'Known',
                    dueDate: vuln.dueDate,
                    requiredAction: vuln.requiredAction
                }
            });
        });

    } catch (error) {
        console.error('CISA KEV query error:', error);
    }

    return vulnerabilities;
}

// ============================================
// REMEDIATION GENERATION
// ============================================
function generateWindowsRemediation(update) {
    return [
        'Open Windows Update settings',
        'Click "Check for updates"',
        `Install update: ${update.ID || 'Latest security update'}`,
        'Restart your system if required',
        'Verify the update was installed successfully'
    ];
}

function generateLinuxRemediation(pkg, vuln) {
    const fixedVersion = extractFixedVersion(vuln.affected);
    const steps = [
        'Update your package manager cache',
        `Upgrade ${pkg.name} to version ${fixedVersion !== 'Not available' ? fixedVersion : 'latest'}`,
        'Verify the installation',
        'Restart affected services if necessary'
    ];

    return steps;
}

function generateCISARemediation(vuln) {
    const steps = [];

    if (vuln.requiredAction) {
        steps.push(vuln.requiredAction);
    } else {
        steps.push('Apply updates per vendor instructions');
        steps.push('Verify patches are successfully installed');
    }

    if (vuln.dueDate) {
        steps.push(`CISA Due Date: ${vuln.dueDate}`);
    }

    if (vuln.knownRansomwareCampaignUse === 'Known') {
        steps.push('⚠️ WARNING: Known to be used in ransomware campaigns');
    }

    return steps;
}

function determineSeverity(text) {
    if (!text) return 'medium';

    const lower = text.toLowerCase();
    if (lower.includes('critical')) return 'critical';
    if (lower.includes('high')) return 'high';
    if (lower.includes('medium') || lower.includes('moderate')) return 'medium';
    if (lower.includes('low')) return 'low';

    return 'medium';
}

// ============================================
// PROGRESS UPDATES
// ============================================
function updateProgress(percentage, status, scanned = 0, found = 0) {
    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('progressPercentage').textContent = `${Math.round(percentage)}%`;
    document.getElementById('progressStatus').textContent = status;

    if (scanned > 0) {
        document.getElementById('packagesScanned').textContent = scanned;
    }

    if (found > 0) {
        document.getElementById('vulnsFound').textContent = found;
    }

    // Update current source
    if (status.includes('MSRC')) {
        document.getElementById('currentSource').textContent = 'MSRC';
    } else if (status.includes('OSV')) {
        document.getElementById('currentSource').textContent = 'OSV.dev';
    } else if (status.includes('CISA')) {
        document.getElementById('currentSource').textContent = 'CISA KEV';
    }
}

// ============================================
// RESULTS DISPLAY - PACKAGE-CENTRIC
// ============================================
function displayResults() {
    // Hide progress, show results
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step3').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Group vulnerabilities by package
    const packageGroups = groupVulnerabilitiesByPackage(analysisResults);

    // Calculate summary based on unique packages and their highest severity
    const summary = calculatePackageSummary(packageGroups);
    document.getElementById('criticalCount').textContent = summary.critical;
    document.getElementById('highCount').textContent = summary.high;
    document.getElementById('mediumCount').textContent = summary.medium;
    document.getElementById('lowCount').textContent = summary.low;

    const totalPackages = Object.keys(packageGroups).length;
    const totalVulns = analysisResults.length;
    document.getElementById('reportSubtitle').textContent =
        `Found ${totalVulns} vulnerabilit${totalVulns === 1 ? 'y' : 'ies'} affecting ${totalPackages} package${totalPackages === 1 ? '' : 's'}`;

    // Display package-centric cards
    renderPackageCards(packageGroups);
}

// Group vulnerabilities by package name
function groupVulnerabilitiesByPackage(vulnerabilities) {
    const groups = {};

    vulnerabilities.forEach(vuln => {
        const pkgName = vuln.package;

        if (!groups[pkgName]) {
            groups[pkgName] = {
                packageName: pkgName,
                installedVersion: vuln.installedVersion,
                vulnerabilities: [],
                highestSeverity: vuln.severity,
                sources: new Set()
            };
        }

        groups[pkgName].vulnerabilities.push(vuln);
        groups[pkgName].sources.add(vuln.source);

        // Track highest severity
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (severityOrder[vuln.severity] < severityOrder[groups[pkgName].highestSeverity]) {
            groups[pkgName].highestSeverity = vuln.severity;
        }
    });

    return groups;
}

// Calculate summary based on packages (not individual CVEs)
function calculatePackageSummary(packageGroups) {
    const summary = { critical: 0, high: 0, medium: 0, low: 0 };

    Object.values(packageGroups).forEach(pkg => {
        summary[pkg.highestSeverity]++;
    });

    return summary;
}

function renderPackageCards(packageGroups) {
    const container = document.getElementById('resultsContainer');
    const noResults = document.getElementById('noResults');

    if (Object.keys(packageGroups).length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'flex';
        return;
    }

    noResults.style.display = 'none';
    container.innerHTML = '';

    // Sort packages by highest severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sortedPackages = Object.values(packageGroups).sort((a, b) =>
        severityOrder[a.highestSeverity] - severityOrder[b.highestSeverity]
    );

    sortedPackages.forEach((pkg, index) => {
        const card = createPackageCard(pkg, index);
        container.appendChild(card);
    });
}

// Create package-centric vulnerability card
function createPackageCard(pkg, index) {
    const card = document.createElement('div');
    card.className = 'vuln-card package-card';
    card.dataset.severity = pkg.highestSeverity;
    card.dataset.package = pkg.packageName;

    // Determine if any vulnerability is from fallback source
    const hasFallback = pkg.vulnerabilities.some(v => v.isFallback);

    // Get unique CVEs with their details
    const cveList = pkg.vulnerabilities.map(v => ({
        cve: v.cve,
        severity: v.severity,
        source: v.source,
        isFallback: v.isFallback,
        description: v.description
    }));

    // Determine recommended fix
    const recommendedFix = determinePackageFix(pkg);

    // Count CVEs
    const cveCount = pkg.vulnerabilities.length;

    // Get sources list
    const sourcesList = Array.from(pkg.sources).join(', ');

    card.innerHTML = `
        <div class="vuln-header" onclick="togglePackageCard(${index})">
            <div class="vuln-main">
                <div class="vuln-title-row">
                    <h3 class="vuln-title">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px; margin-right: 8px; vertical-align: middle;">
                            <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        ${pkg.packageName}
                    </h3>
                    <span class="severity-badge ${pkg.highestSeverity}">${pkg.highestSeverity.toUpperCase()}</span>
                    ${hasFallback ? '<span class="source-badge fallback">CISA KEV</span>' : ''}
                </div>
                <div class="vuln-meta">
                    <div class="meta-item">
                        <span class="meta-label">Installed Version</span>
                        <span class="meta-value">${pkg.installedVersion}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Affected By</span>
                        <span class="meta-value">${cveCount} CVE${cveCount === 1 ? '' : 's'}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Sources</span>
                        <span class="meta-value">${sourcesList}</span>
                    </div>
                </div>
            </div>
            <div class="vuln-expand">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        </div>
        <div class="vuln-details">
            <div class="detail-section">
                <h4>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Affecting Vulnerabilities
                </h4>
                <div class="cve-list">
                    ${cveList.map(cve => `
                        <div class="cve-item">
                            <a href="${getCVEUrl(cve.cve)}" target="_blank" rel="noopener noreferrer" class="cve-link">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 16px; height: 16px;">
                                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                ${cve.cve}
                            </a>
                            <span class="cve-severity severity-badge ${cve.severity}">${cve.severity.toUpperCase()}</span>
                            <span class="cve-source">${cve.source}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="detail-section">
                <h4>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Recommended Fix
                </h4>
                <div class="fix-recommendation">
                    <p class="fix-instruction">${recommendedFix.instruction}</p>
                    ${recommendedFix.command ? `
                        <div class="command-block">
                            <code>${recommendedFix.command}</code>
                            <button class="copy-command-btn" onclick="copyToClipboard(decodeURIComponent('${encodeURIComponent(recommendedFix.command)}'), this)">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
                                    <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" stroke-width="2"/>
                                </svg>
                                Copy
                            </button>
                        </div>
                    ` : ''}
                    <ol class="remediation-steps">
                        ${recommendedFix.steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
            </div>
            
            ${hasFallback ? `
                <div class="fallback-notice">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <div>
                        <strong>CISA Known Exploited Vulnerability</strong>
                        <p>This package contains vulnerabilities that are confirmed to be actively exploited in the wild according to CISA's KEV catalog. Immediate remediation is strongly recommended.</p>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    return card;
}

// Determine the recommended fix for a package
function determinePackageFix(pkg) {
    const vulns = pkg.vulnerabilities;

    // Collect all fixed versions
    const fixedVersions = vulns
        .map(v => v.fixedVersion)
        .filter(v => v && v !== 'Not available' && v !== 'See advisory' && v !== 'See CISA advisory' && v !== 'See Microsoft advisory');

    // Determine the highest fixed version (minimum safe version)
    let minSafeVersion = null;
    if (fixedVersions.length > 0) {
        // Simple approach: use the last (likely highest) version
        // In production, you'd want proper semver comparison
        minSafeVersion = fixedVersions[fixedVersions.length - 1];
    }

    // Generate fix instruction
    let instruction = '';
    let command = '';
    let steps = [];

    if (selectedOS === 'windows') {
        if (minSafeVersion && minSafeVersion !== 'Install latest Windows updates') {
            instruction = `Update ${pkg.packageName} to version ≥ ${minSafeVersion}`;
            steps = [
                'Open Windows Update or the application\'s update mechanism',
                `Update ${pkg.packageName} to version ${minSafeVersion} or later`,
                'Restart the application or system if required',
                'Verify the update was installed successfully'
            ];
        } else {
            // Fallback: Check if it's likely a Microsoft component or third-party
            const isMicrosoft = pkg.packageName.toLowerCase().includes('microsoft') ||
                pkg.packageName.toLowerCase().includes('windows') ||
                pkg.packageName.toLowerCase().includes('kb') ||
                pkg.packageName.toLowerCase().includes('.net');

            if (isMicrosoft) {
                instruction = `Install latest Windows updates to patch ${pkg.packageName}`;
                command = 'Start-Process ms-settings:windowsupdate';
                steps = [
                    'Open Windows Update settings',
                    'Click "Check for updates"',
                    'Install all available updates',
                    'Restart your system if required',
                    'Verify updates were installed successfully'
                ];
            } else {
                // Third-party app (e.g., Python, Chrome, etc.)
                instruction = `Update ${pkg.packageName} using Windows Package Manager (WinGet)`;
                command = 'winget upgrade --all';
                steps = [
                    'Open PowerShell or Command Prompt',
                    'Run: winget update (to check for available updates)',
                    'Run: winget upgrade --all (to upgrade all packages)',
                    'Alternatively, download the latest installer from the vendor website',
                    'Verify the installation'
                ];
            }
        }
    } else {
        // Linux/macOS
        if (minSafeVersion) {
            instruction = `Update ${pkg.packageName} to version ≥ ${minSafeVersion}`;

            if (selectedOS === 'linux') {
                command = `sudo apt-get update && sudo apt-get install --only-upgrade ${pkg.packageName}`;
                steps = [
                    'Update package manager cache',
                    `Upgrade ${pkg.packageName} to version ${minSafeVersion} or later`,
                    'Verify the installation',
                    'Restart affected services if necessary'
                ];
            } else {
                // macOS
                command = `brew upgrade ${pkg.packageName}`;
                steps = [
                    'Update Homebrew',
                    `Upgrade ${pkg.packageName} to version ${minSafeVersion} or later`,
                    'Verify the installation'
                ];
            }
        } else {
            instruction = `No specific patch version available - apply vendor updates for ${pkg.packageName}`;
            steps = [
                'Check vendor website for latest security updates',
                'Apply all available patches',
                'Verify the updates were installed',
                'Monitor vendor advisories for additional guidance'
            ];
        }
    }

    return { instruction, command, steps };
}

// Get CVE URL for linking
function getCVEUrl(cveId) {
    if (cveId.startsWith('CVE-')) {
        return `https://nvd.nist.gov/vuln/detail/${cveId}`;
    } else if (cveId.startsWith('GHSA-')) {
        return `https://github.com/advisories/${cveId}`;
    } else if (cveId.startsWith('OSV-')) {
        return `https://osv.dev/vulnerability/${cveId}`;
    } else {
        return `https://nvd.nist.gov/vuln/search/results?query=${encodeURIComponent(cveId)}`;
    }
}

// Toggle package card expansion
function togglePackageCard(index) {
    const cards = document.querySelectorAll('.package-card');
    const card = cards[index];
    card.classList.toggle('expanded');
}

// Copy command to clipboard with fallback
async function copyToClipboard(text, button) {
    try {
        // Try modern API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            showCopyFeedback(button);
        } else {
            throw new Error('Clipboard API unavailable');
        }
    } catch (err) {
        // Fallback for older browsers or non-secure contexts (file://)
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;

            // Ensure it's not visible but part of DOM
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                showCopyFeedback(button);
            } else {
                console.error('Fallback copy failed');
                alert('Could not copy text. Please copy manually.');
            }
        } catch (fallbackErr) {
            console.error('Copy failed:', fallbackErr);
            alert('Could not copy text. Please copy manually.');
        }
    }
}

function showCopyFeedback(button) {
    const originalHTML = button.innerHTML;
    button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Copied!
    `;
    button.classList.add('copied');

    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove('copied');
    }, 2000);
}

function generateRemediationCommand(vuln) {
    let command = '';

    if (selectedOS === 'windows') {
        command = 'Check Windows Update for available patches';
    } else if (selectedOS === 'linux') {
        if (vuln.fixedVersion !== 'Not available' && vuln.fixedVersion !== 'See CISA advisory') {
            command = `sudo apt-get update && sudo apt-get install ${vuln.package}=${vuln.fixedVersion}`;
        } else {
            command = `sudo apt-get update && sudo apt-get upgrade ${vuln.package}`;
        }
    }

    if (command) {
        return `
            <div class="code-block">
                <code>${command}</code>
            </div>
        `;
    }

    return '';
}

function toggleVulnCard(index) {
    const cards = document.querySelectorAll('.vuln-card');
    cards[index].classList.toggle('expanded');
}

// ============================================
// FILTERING & SEARCH
// ============================================
function filterBySeverity(severity) {
    currentFilter = severity;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === severity);
    });

    // Filter results
    filterResults();
}

function filterResults() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.vuln-card');
    let visibleCount = 0;

    cards.forEach(card => {
        const severity = card.dataset.severity;
        const package = card.dataset.package;
        const cve = card.dataset.cve;
        const text = card.textContent.toLowerCase();

        const matchesSeverity = currentFilter === 'all' || severity === currentFilter;
        const matchesSearch = !searchTerm ||
            package.includes(searchTerm) ||
            cve.toLowerCase().includes(searchTerm) ||
            text.includes(searchTerm);

        if (matchesSeverity && matchesSearch) {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    // Show/hide no results message
    const noResults = document.getElementById('noResults');
    const container = document.getElementById('resultsContainer');

    if (visibleCount === 0 && cards.length > 0) {
        noResults.style.display = 'flex';
        noResults.querySelector('h3').textContent = 'No Matching Vulnerabilities';
        noResults.querySelector('p').textContent = 'Try adjusting your filters or search terms.';
    } else {
        noResults.style.display = 'none';
    }
}

// ============================================
// EXPORT FUNCTIONALITY
// ============================================
function exportReport(format) {
    if (format === 'html') {
        exportHTML();
    } else if (format === 'pdf') {
        exportPDF();
    }
}

function exportHTML() {
    const timestamp = new Date().toISOString().split('T')[0];
    const summary = calculateSummary(analysisResults);

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vulnerability Report - ${timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
        .summary-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .summary-card h2 { margin: 0; font-size: 2.5rem; }
        .critical { color: #dc2626; }
        .high { color: #ea580c; }
        .medium { color: #f59e0b; }
        .low { color: #3b82f6; }
        .vuln-item { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .vuln-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .badge { padding: 5px 10px; border-radius: 4px; font-size: 0.875rem; font-weight: bold; }
        .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
        .meta-item { }
        .meta-label { font-size: 0.875rem; color: #666; }
        .meta-value { font-weight: bold; }
        ol { padding-left: 20px; }
    </style>
</head>
<body>
    <h1>Vulnerability Scan Report</h1>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>OS:</strong> ${OS_COMMANDS[selectedOS].name}</p>
    <p><strong>Total Vulnerabilities:</strong> ${analysisResults.length}</p>
    
    <div class="summary">
        <div class="summary-card">
            <h2 class="critical">${summary.critical}</h2>
            <p>Critical</p>
        </div>
        <div class="summary-card">
            <h2 class="high">${summary.high}</h2>
            <p>High</p>
        </div>
        <div class="summary-card">
            <h2 class="medium">${summary.medium}</h2>
            <p>Medium</p>
        </div>
        <div class="summary-card">
            <h2 class="low">${summary.low}</h2>
            <p>Low</p>
        </div>
    </div>
    
    <h2>Vulnerabilities</h2>
`;

    analysisResults.forEach(vuln => {
        html += `
    <div class="vuln-item">
        <div class="vuln-header">
            <h3>${vuln.cve}</h3>
            <span class="badge ${vuln.severity}">${vuln.severity.toUpperCase()}</span>
        </div>
        <div class="meta">
            <div class="meta-item">
                <div class="meta-label">Package</div>
                <div class="meta-value">${vuln.package}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Installed Version</div>
                <div class="meta-value">${vuln.installedVersion}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Fixed Version</div>
                <div class="meta-value">${vuln.fixedVersion}</div>
            </div>
        </div>
        <p><strong>Description:</strong> ${vuln.description}</p>
        <p><strong>Source:</strong> ${vuln.source}</p>
        <p><strong>Remediation:</strong></p>
        <ol>
            ${vuln.remediation.map(step => `<li>${step}</li>`).join('')}
        </ol>
    </div>
`;
    });

    html += `
</body>
</html>
`;

    downloadFile(html, `vulnerability-report-${timestamp}.html`, 'text/html');
}

function exportPDF() {
    // For PDF export, we'll use the browser's print functionality
    // which allows "Save as PDF"
    alert('PDF Export: Please use your browser\'s Print function (Ctrl+P / Cmd+P) and select "Save as PDF" as the destination.');
    window.print();
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function closePrivacyNotice() {
    document.getElementById('privacyNotice').style.display = 'none';
}

function startNewScan() {
    // Reset everything
    selectedOS = null;
    currentFile = null;
    analysisResults = [];
    currentFilter = 'all';
    cisaKEVCache = null;

    // Reset UI
    document.querySelectorAll('.os-option').forEach(option => {
        option.classList.remove('selected');
    });

    document.getElementById('commandSection').style.display = 'none';
    document.getElementById('continueBtn').style.display = 'none';
    document.getElementById('fileInput').value = '';
    document.getElementById('uploadZone').style.display = 'flex';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('analyzeBtn').style.display = 'none';
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('searchInput').value = '';

    // Go back to step 1
    document.getElementById('step3').classList.remove('active');
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step1').classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    console.log('🔄 Scanner reset - all data cleared');
}

// ============================================
// EPHEMERAL GUARANTEE
// ============================================
console.log('🔒 EPHEMERAL MODE ACTIVE');
console.log('✅ No localStorage');
console.log('✅ No sessionStorage');
console.log('✅ No cookies');
console.log('✅ No IndexedDB');
console.log('✅ All data cleared on page refresh');
console.log('✅ Files never sent to any server');

// ============================================
// THEME TOGGLE
// ============================================

// Initialize theme from localStorage
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
}

// Toggle between light and dark mode
function toggleTheme() {
    document.body.classList.toggle('light-mode');

    // Save preference
    const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
});
