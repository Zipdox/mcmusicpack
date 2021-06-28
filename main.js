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
    file.onchange = function(){
        if(this.files[0] == undefined || name.value != "") return;
        name.value = this.files[0].name.substr(0, this.files[0].name.lastIndexOf('.')) || this.files[0].name;
    }
    row.insertCell().appendChild(file);

    table.appendChild(row);
}

document.getElementById('generate').onclick = async function(){
    this.textContent = 'Initializing zip file...';

    const blobWriter = new zip.BlobWriter("application/zip");
    const writer = new zip.ZipWriter(blobWriter);

    let pack_format = document.getElementById('version').value;

    let langFileText = '';
    let langFileObject = {};

    for(let disc of discs){
        this.textContent = `Adding ${disc}...`;

        let name = document.getElementById(disc + '-name').value ? document.getElementById(disc + '-name').value : disc;
        let file = document.getElementById(disc + '-file').files[0];

        if(file == undefined) continue;

        if(!file.name.endsWith('.ogg')){
            alert("You added a file that's not Ogg Vorbis, it will be ignored.");
            continue;
        }

        let data = await readFile(file);

        await writer.add(`assets/minecraft/sounds/records/${disc}.ogg`, new zip.Uint8ArrayReader(new Uint8Array(data)));

        if(pack_format >= 4){
            langFileObject[`item.minecraft.music_disc_${disc}.desc`] = name;
        }else{
            langFileText += `item.record.${disc}.desc=${name}\n`;
        }
    }

    if(pack_format >= 4){
        langFileText = JSON.stringify(langFileObject, null, 4);
    }else{
        if(langFileText.endsWith('\n')) langFileText = langFileText.slice(0, -1);
    }

    this.textContent = 'Adding lang files...';
    for(let langFile of langFiles){
        if(pack_format >= 4){
            await writer.add(`assets/minecraft/lang/${langFile}.json`, new zip.TextReader(langFileText));
        }else{
            await writer.add(`assets/minecraft/lang/${langFile}.lang`, new zip.TextReader(langFileText));
        }
        
    }

    this.textContent = 'Adding pack.mcmeta...';
    let mcMeta = packMCMeta;
    mcMeta.pack.description = document.getElementById('packdescription').value ? document.getElementById('packdescription').value : 'A music resource pack';
    mcMeta.pack.pack_format = pack_format;
    await writer.add('pack.mcmeta', new zip.TextReader(JSON.stringify(mcMeta, null, 2)));

    this.textContent = 'Adding pack.png...';
    let iconFile = document.getElementById('packicon').files[0];
    if(iconFile != undefined){
        let iconData = await readFile(iconFile);
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