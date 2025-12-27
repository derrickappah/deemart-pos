export const exportToCSV = (data, filename) => {
    if (!data || !data.length) {
        console.warn('No data to export');
        return;
    }

    const separator = ',';
    const keys = Object.keys(data[0]);

    const csvContent = [
        keys.join(separator),
        ...data.map(row => keys.map(key => {
            let cell = row[key] === null || row[key] === undefined ? '' : row[key];
            cell = cell.toString().replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
            }
            return cell;
        }).join(separator))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const exportToJSON = (data, filename) => {
    if (!data || !data.length) {
        console.warn('No data to export');
        return;
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                if (inQuotes && line[j + 1] === '"') {
                    currentValue += '"';
                    j++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim()); // Add last value
        
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    
    return data;
};

export const parseJSON = (jsonText) => {
    try {
        const data = JSON.parse(jsonText);
        if (!Array.isArray(data)) {
            throw new Error('JSON file must contain an array of products');
        }
        return data;
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error('Invalid JSON format: ' + error.message);
        }
        throw error;
    }
};