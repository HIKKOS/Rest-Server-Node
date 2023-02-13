const  path  = require('path')
const  fs  = require('fs')

const { response, request } = require("express")
const { uploadFile } = require("../helpers")
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const cargarArchivo = async (req = require, res = response) => {
    let { ServicioId } = req.params
    const servicio = await prisma.servicio.findUnique( { where: { Id: ServicioId } } )
    try {
        const dir = await uploadFile(req.files, undefined, servicio.Id)
        const archivo = await prisma.imgPaths.create({
            data : { 
                Path: dir,
                ServicioId: (servicio.Id)
            }
        })
        res.status(201).json({ 
            msg:`se subio la foto ${ archivo.Id } del servicio: ${servicio.Nombre} `
        })
    } catch (error) {
        console.log(error);
      res.status(400).json({error})
    }
}
const actualizarImagen = async( req = request, res = response ) => {
    const { Id, ServicioId } = req.params    
    const Servicio = await prisma.servicio.findUnique( { where: { Id: ServicioId } } )   
    const imgPath = await prisma.imgPaths.findUnique({ where : { Id: Number(Id) } })
    try {
        const nombre = await uploadFile(req.files, undefined, ServicioId)
        await prisma.imgPaths.update({ 
            data:{
                Path: nombre
            },
            where: { Id:Number(Id) },
    
        })
        const pathImg = path.join(__dirname,'../uploads/',ServicioId, imgPath.Path)
        if(fs.existsSync(pathImg)){
            fs.unlinkSync(pathImg)
        }
        return res.status(200).json({ 
            msg:`el serivicio ${Servicio.Nombre} actualizo la foto con id ${Id} con el archivo ${nombre}`
        })
    } catch (error) {
        console.log('------------------------');
        console.log(error);
        return res.status(400).json({error})
    }
    
}
const MostrarImagen = async (req = request, res = response ) => {
    const { ServicioId, Id } = req.params        
    
    const img = await prisma.imgPaths.findUnique({ where: { Id: Number(Id) } })
    if( !img ){
        return res.status(400).json({
            msg:`No existe una imagen con id ${Id}`
        })
    }
    const pathImagen = path.join(__dirname,'../uploads/',ServicioId,img.Path)
    if( !fs.existsSync(pathImagen) ){
        const pathImagen = path.join(__dirname,'../assets/no-image.jpg')
        return res.sendFile(pathImagen)
    }
    return res.sendFile(pathImagen)      
    
}
const deleteImagen = async (req = request, res = response) => {
    const { Id, ServicioId } = req.params
    const servicio = await prisma.servicio.findUnique( { where : { Id: ServicioId } } )
    if(!servicio){
        return res.status(400).json({
            msg: `No existe el servicio con el id: ${ServicioId}`
        })
    }
    let imgs = await prisma.imgPaths.findMany({
        where: { ServicioId: (ServicioId) }
    })
    const paths = imgs
    imgs = imgs.map( i =>{
        return i.Id
    })
console.log(imgs);
    if( ( !imgs.includes(Number(Id)) ) ){        
        return res.status(400).json({
            msg: `No existe el la imagen con el id: ${Id}`
        })
    }
    paths.map( p => {
        const pathImagen = path.join(__dirname,'../uploads/',ServicioId,p.Path)
        if(fs.existsSync(pathImagen)){
            fs.rm(pathImagen)
        }
    })
    await prisma.imgPaths.delete({ where: { Id: Number(Id) } })
    res.json({
       msg: `Se  borro la foto con id: ${Id} del serivicio ${servicio.Nombre}`
    })

}



module.exports = {
    cargarArchivo,
    actualizarImagen,
    MostrarImagen,  
    deleteImagen,
}