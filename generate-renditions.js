import sharp from "sharp";
import fs from 'node:fs';
import path from 'node:path';
import * as StreamPromises from "stream/promises";

const cwd = process.cwd();

const configFileData = fs.readFileSync('./rendition-config.json');

const { inputConfigs, outputConfig } = JSON.parse(configFileData);

const renderResolutionConfig = outputConfig.renderResolutions;
let renderResolutions = [];
if(renderResolutionConfig.length > 0) {
    renderResolutions = renderResolutionConfig.flatMap(res => {
        var {dimensions} = res;
        return dimensions;
    });
}

for(const inputConfig of inputConfigs) {
    let inputType = "";
    const inputPathStr = inputConfig.path;  
    console.log("Checking input folder at "+inputPathStr);
    if(fs.existsSync(inputPathStr)) {
        console.log("Input folder exists!");
        try {
            fs.accessSync(inputPathStr, fs.constants.R_OK)
        }
        catch (err) {
            console.error("Error while accessing input folder ", err);
        }
        if(fs.lstatSync(inputPathStr).isFile())
            inputType = "file";
        else if(fs.lstatSync(inputPathStr).isDirectory())
            inputType = "dir";
        else 
            console.error("Unknown input path specfied\n Path specified was: "+inputPathStr);
    }
    else {
        console.error("Path does not exist!\n"+inputPathStr);
    }

    function handleWriteStreamError(info) {
        console.log("Writing encountered an error", info);
    }
    function handleReadStreamError(info) {
        console.log("Reading encountered an error", info);
    }

    function getOutputPathAbs(fileInfo) {
        const outputDir = outputConfig.dirPath
        , outputPathFormat = outputConfig.deepPath || "";

        let outputPath = outputDir;
        console.log("Checking output path at "+outputPath);
        if(outputPathFormat != "") {
            const fullOutputPathFormat = path.join(outputDir, outputPathFormat);
            if(fullOutputPathFormat.match(/[\S]/)) {
                console.log("Processing deep path format ", fullOutputPathFormat);
                outputPath = fullOutputPathFormat
                .split(path.sep)
                .map(dirname => {
                    const formatType = dirname.match(/\[\S+\]/);
                    if(!!formatType) {
                        switch(formatType[0]) {
                            case "[image-name]":
                                return fileInfo.name;
                            case "[date-time]":
                                let dtFrmtStr = "YYYY-MM-DD_hh-mm";
                                const format = dirname.match(/\{(\S+)\}/);
                                if(format) {
                                    const cDate = new Date();
                                    dtFrmtStr = format[1]
                                    .replace('YYYY', cDate.getFullYear())
                                    .replace('DD', cDate.getDate())
                                    .replace('MM', cDate.getMonth())
                                    .replace('hh', cDate.getHours())
                                    .replace('mm', cDate.getMinutes())
                                    .replace('ss', cDate.getSeconds());
                                }
                                return dtFrmtStr;
                        }
                    }
                    else return dirname;
                })
                .join(path.sep);
            }
            else {
                console.log("No formatted path supplied. Moving on..");
            }
        }
        else {
            console.log("No deep path supplied! Rendering everything within output dir..");
        }
        outputPath = outputPath.replace(path.extname(outputPath),"");
        console.log("Processed final output path: ", outputPath);
        return path.isAbsolute(outputPath) ? outputPath : path.join(cwd, outputPath);
    }

    const inputPathAbs = path.isAbsolute(inputPathStr) ? inputPathStr : path.join(cwd, inputPathStr);
    let filesToBeProcessed = fs.readdirSync(inputPathAbs, {withFileTypes: true});

    async function processFile(file) {
        const isProcessable = !!file.name.match(/\.(jpg|png|svg)$/);
        if(isProcessable) {
            const outputPathAbs = getOutputPathAbs(file);
            if(!fs.existsSync(outputPathAbs)) {
                console.log("Output folder doesnt exist! Creating directory/directories...");
                fs.mkdirSync(outputPathAbs, { recursive: true });
            }
            let sharpStream = sharp();
            renderResolutions.forEach(async function generateRendition(dimens) {
                const [width, height] = dimens.split('.').map(d => Number(d))
                , fileExt = path.extname(file.name)
                , fileName = "".concat(file.name.replace(fileExt, ""), ".", dimens, fileExt)
                , outputFilePathAbs = path.join(outputPathAbs, fileName);
                let writeStream = fs.createWriteStream(outputFilePathAbs);
                writeStream.on("error", handleWriteStreamError);
                sharpStream.clone().resize(width, height).pipe(writeStream);
            });

            let readableStream = fs.createReadStream(path.join(inputPathAbs, file.name));
            readableStream.on("error", handleReadStreamError);
            readableStream.pipe(sharpStream);
            await StreamPromises.finished(readableStream);
        }
    }

    for (const file of filesToBeProcessed) {
        console.log("\nProcessing file: "+file.name);
        await processFile(file);
    }
}