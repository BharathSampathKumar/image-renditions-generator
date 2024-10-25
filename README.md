# Image Renditions Generator
Reduce high resolution image into smaller images

## Use-case
* When your website needs to serve responsive images, this script can be used to generate standard sizes

## Features
* The script is capable of processing any number of images stored in one or more directories and render upto 10 renditions per image.
* The script reads the configuration from rendition-config.js to learn about the input sources and process them into the output directories
* The output directory path to pipe the output image renditions can be configured as a pattern 

## Limitations
* I have written this script for my particular need to render images into smaller standard screen resolution sizes.
* This script accepts JPG/JPEG, PNG, SVG but is only capable of processing JPG/JPEG files. It would have to be improved upon to process other file types.

## How to use
1. Ensure the configuration is setup properly and follows the data structure and guidelines outlined below:
    * `inputConfigs` \[Array\<inputFilePath>] - absolute/relative paths okay
        * `path` \[String] - Path to the input raw high-res images; single file or a directory of files is okay
        * `fileType` \[undefined|String] - Options: `jpg` | `png` | `svg`
    * `outputConfig` \[object] 
        * `dirPath` \[String] - Path to the output high-res images; directory will be generated if not present.
        * `deepPath` \[String] - Path to store the images within the directory pointed by `dirPath`. formatting options available
            * `[date-time]` - Replaces with the date time per the format specified within `{}` in _local time_
                * `YYYY` - Year
                * `MM` - Month
                * `DD` - Date
                * `hh` - hours
                * `mm` - minutes
                * `ss` - seconds
            Examples: `[date-time]{YYYY-MM-DD_hh:mm:ss}` , `[date-time]{YYYY-MM-DD_hh:mm}`
            * `[image-name]` - Replaces with the name of the input image
        * `renderResolutions` \[object]
            * `aspectRatio` \[String] - Optional and can be omitted. 
            * `dimensions` \[Array\<String>] - All of output dimensions (in px) has to be stored with an object `{}` under the key `dimensions`

2. `cd image-renditions-generator && npm install`
3. `npm run generate`

### Footnotes
The default config file is setup to parse (JPG) images from the `raw-assets` directory and pipe them into `renders` directory