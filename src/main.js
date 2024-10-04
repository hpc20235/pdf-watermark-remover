import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'node:fs/promises';
import meow from '@0xengine/meow';

const cli = meow(`
	Usage
	  $ npm run clean -- -i [input_pdf] -o [output_pdf] -b [x1,y1,x2,y2]

	Options
		--input, -i Watermarked /path/to/file
		--output, -o Cleaned /path/to/file
		--box, -b Comma-separated coordinates of watermark (x1,y1,x2,y2)
		
	Examples
		$ npm run clean -- --help
	  $ npm run clean -- -i input.pdf -o output.pdf -b 0,812,550,550
`, {
	importMeta: import.meta,
	flags: {
		input: {
			type: 'string',
			shortFlag: 'i'
		},
		output: {
			type: 'string',
			shortFlag: 'o'
		},
		box: {
			type: "string",
			shortFlag: "b"
		}
	}
});

async function removeWatermark(inputFilePath, outputFilePath, watermarkCoordinates) {
    
    const existingPdfBytes = await fs.readFile(inputFilePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();
    const { x1, y1, x2, y2 } = watermarkCoordinates;

    const watermarkWidth = x2 - x1;
    const watermarkHeight = y1 - y2;

    if (watermarkWidth <= 0 || watermarkHeight <= 0) {
        console.error('Invalid coordinates for watermark removal.');
        return;
    }

		const { width, height } = pages[0].getSize();
		console.log(`Page dims:${width}x${height}`)

    pages.forEach(page => {
			page.drawRectangle({
				x: x1,
				y: y1,
				width: watermarkWidth,
				height: watermarkHeight,
				color: rgb(1, 1, 1),
				opacity: 1, 
			});
    });

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputFilePath, pdfBytes);
}


function printErrMsgAndExit(msg) {
	console.log(`ERROR: ${msg}`)
	console.log("Run\n npm run clean -- --help\nfor help")
	process.exit(0)
}

async function main() {
	const inputPdf = cli.flags.input
	const outputPdf = cli.flags.output
	const box = cli.flags.box
	const [x1,y1,x2,y2] = box.split(",")

	console.log(`inputPdf: ${inputPdf}, outputPdf: ${outputPdf}, x1: ${x1}, y1: ${y1}  x2: ${x2}, y2: ${y2}`)
	if (inputPdf === "" || inputPdf === undefined) {
		printErrMsgAndExit("input file invalid")
	}
	if (outputPdf === "" || outputPdf === undefined) {
		printErrMsgAndExit("output file invalid")
	}
	if (x1 === "" || x1 === undefined) {
		printErrMsgAndExit("'x1 invalid")
	}
	if (x2 === "" || x2 === undefined) {
		printErrMsgAndExit("x2 invalid")
	}
	if (y1 === "" || y1 === undefined) {
		printErrMsgAndExit("y1 invalid")
	}
	if (y2 === "" || y2 === undefined) {
		printErrMsgAndExit("y2 invalid")
	}
	
	const watermarkCoordinates = {x1:Number(x1),y1:Number(y1),x2:Number(x2),y2:Number(y2)}
	await removeWatermark(inputPdf, outputPdf,watermarkCoordinates)
	console.log('Watermark obscured and saved to output.pdf');
}

main();