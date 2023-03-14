const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const { response, request } = require("express");
const { uploadFile } = require("../helpers");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const cargarArchivo = async (req = require, res = response) => {
	let { ServicioId } = req.params;
	const Servicio = await prisma.Servicio.findUnique({
		where: { Id: ServicioId },
	});
	try {
		const dir = await uploadFile(req.files, undefined, Servicio.Id);
		const archivo = await prisma.ImgPaths.create({
			data: {
				Id: uuidv4(),
				Path: dir,
				ServicioId: Servicio.Id,
			},
		});
		res.status(201).json({
			msg: `se subio la foto ${archivo.Id} del Servicio: ${Servicio.Nombre} `,
		});
	} catch (error) {
		console.log(error);
		res.status(400).json({ error });
	}
};
const actualizarImagen = async (req = request, res = response) => {
	const { Id, ServicioId } = req.params;
	const Servicio = await prisma.Servicio.findUnique({
		where: { Id: ServicioId },
	});
	const imgPath = await prisma.ImgPaths.findUnique({
		where: { Id: Number(Id) },
	});
	try {
		const nombre = await uploadFile(req.files, undefined, ServicioId);
		await prisma.ImgPaths.update({
			data: {
				Path: nombre,
			},
			where: { Id: Number(Id) },
		});
		const pathImg = path.join(
			__dirname,
			"../uploads/",
			ServicioId,
			imgPath.Path,
		);
		if (fs.existsSync(pathImg)) {
			fs.unlinkSync(pathImg);
		}
		return res.status(200).json({
			msg: `el serivicio ${Servicio.Nombre} actualizo la foto con id ${Id} con el archivo ${nombre}`,
		});
	} catch (error) {
		console.log("------------------------");
		console.log(error);
		return res.status(400).json({ error });
	}
};
const MostrarImagen = async (req = request, res = response) => {
	const { ServicioId, Id } = req.params;
	const img = await prisma.imgPaths.findUnique({ where: { Id } });
	const { Path } = img;

	const pathImagen = path.join(__dirname, "../uploads/", ServicioId, Path);
	if (!fs.existsSync(pathImagen) || Id === '404') {
		const pathImagen = path.join(__dirname, "../assets/no-image.jpg");
		return res.sendFile(pathImagen);
	}
	return res.sendFile(pathImagen);
};
const deleteImagen = async (req = request, res = response) => {
    const { Id, ServicioId } = req.params;
	const uimg = await prisma.imgPaths.findUnique({
		where: { Id },
		select: { Path: true },
	});
    if(!uimg){
        return res.status(404).json({
            msg: "no existe la imagen"
        })
    }
    const { Path } = uimg
	const pathImagen = path.join(__dirname, "../uploads/", ServicioId, Path);

    if (fs.existsSync(pathImagen)) {
        fs.rmSync(pathImagen);
    }
    await prisma.imgPaths.delete({ where: { Id } });
	return res.json({
		msg: `Se  borro la foto con id: ${Id}`,
	});
};

module.exports = {
	cargarArchivo,
	actualizarImagen,
	MostrarImagen,
	deleteImagen,
};
