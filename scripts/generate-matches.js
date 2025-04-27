const fs = require('fs');
const path = require('path');

const fakeData = {
  response: [
    // بيانات وهمية للاستخدام عند فشل API
  ]
};

fs.writeFileSync(
  path.join(__dirname, '../data/matches.json'),
  JSON.stringify(fakeData, null, 2)
);
