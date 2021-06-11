const table = document.getElementById('discs');

for(let disc of discs){
    let row = document.createElement('tr');

    const itemIcon = document.createElement('img');
    itemIcon.setAttribute('src', `items/record_${disc}.png`);
    row.insertCell().appendChild(itemIcon);

    row.insertCell().textContent = disc;

    let name = document.createElement('input');
    name.setAttribute('type', 'text');
    name.setAttribute('placeholder', disc);
    name.setAttribute('id', disc + '-name');
    row.insertCell().appendChild(name);

    let file = document.createElement('input');
    file.setAttribute('type', 'file');
    file.setAttribute('id', disc + '-file');
    row.insertCell().appendChild(file);

    table.appendChild(row);
}

document.getElementById('generate').onclick = async function(){
    this.textContent = 'Initializing zip file...';

    const blobWriter = new zip.BlobWriter("application/zip");
    const writer = new zip.ZipWriter(blobWriter);

    let langFileText = '';

    for(let disc of discs){
        this.textContent = `Adding ${disc}...`;

        let name = document.getElementById(disc + '-name').value;
        let file = document.getElementById(disc + '-file').files[0];

        if(name == '' || file == undefined) continue;

        let data = await readFile(file);

        await writer.add(`assets/minecraft/sounds/records/${disc}.ogg`, new zip.Uint8ArrayReader(new Uint8Array(data)));

        langFileText += `item.record.${disc}.desc=${name}\n`;

        console.log('Added', disc);
    }

    this.textContent = 'Adding lang files...';
    if(langFileText.endsWith('\n')) langFileText = langFileText.slice(0, -1);
    for(let langFile of langFiles){
        await writer.add(`assets/minecraft/lang/${langFile}`, new zip.TextReader(langFileText));
    }

    this.textContent = 'Adding pack.mcmeta...';
    mcMeta = packMCMeta;
    mcMeta.pack.description = document.getElementById('packdescription').value ? document.getElementById('packdescription').value : 'A music resource pack';
    await writer.add('pack.mcmeta', new zip.TextReader(JSON.stringify(mcMeta, null, 2)));

    this.textContent = 'Adding pack.png...';
    let iconFIle = document.getElementById('packicon').files[0];
    if(iconFIle != undefined){
        let iconData = await readFile(iconFIle);
        await writer.add('pack.png', new zip.Uint8ArrayReader(new Uint8Array(iconData)));
    }
    
    this.textContent = 'Finishing zip file...';

    await writer.close();
    let fileName = document.getElementById('packname').value ? document.getElementById('packname').value : 'Resource pack';
    const blob = await blobWriter.getData();
    document.getElementById('packname').value
    saveFile(blob.slice(0, blob.size, 'application/octet-stream'), fileName + '.zip');

    this.textContent = 'Generate resource pack';
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
    
        reader.onload = res => {
            resolve(res.target.result);
        };
        reader.onerror = reject;
    
        reader.readAsArrayBuffer(file);
    });
}

function saveFile(blob, filename) {
    const a = document.createElement('a');
    document.body.appendChild(a);
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 0);
  }