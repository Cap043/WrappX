const fs = require('fs');
const data = fs.readFileSync('config.xml', 'utf-8');
const result = data.replace(/(<\/widget>)/, '\t<icon src="resources/logo.png" density="ldpi" />\n$1');
fs.writeFileSync('config.xml', result);
