const AWS = require("aws-sdk");
const util = require("util");
const https = require("https");
const http = require("http");
const {
	Pool,
	Client
} = require('pg');

const region = "eu-central-1";
AWS.config.update({
	region: region
});

exports.handler = async(event, context) => {
	let headers = {};

	let onebox = require("./node_modules/onebox/index.js");
	let DynDB = new AWS.DynamoDB.DocumentClient();
	onebox.DynDB = DynDB;
	onebox.awsclient = new AWS.SecretsManager({
		region: region
	});
	onebox.https = https;
	onebox.http = http;
	onebox.desarrollo = event.desarrollo !== undefined ? event.desarrollo : false;

	console.log("Parámetros de entrada: ", event);

	let promesa = new Promise(async function(resolve, reject) {

		await onebox.obtenerAPI();
		let secret = await onebox.obtenerDB();
		var pool = new Pool({
			user: secret.username,
			host: secret.host,
			database: secret.dbname,
			password: secret.password,
			port: secret.port
		});
		onebox.DB = await pool.connect();
		await onebox.obtenerToken();

		switch (event.componente) {
			case "producto":
				switch (event.metodo) {
					case "sesion":
						resolve(await onebox.producto.infoSesion(event.parametros.sesion));
						break;
					case "obligatorios":
						resolve(await onebox.producto.obligatoriosEvento(event.parametros.producto, event.parametros.campo));
						break;
					case "obtenerVistas":
						resolve(await onebox.producto.obtenerVistas(event.parametros.sesion));
						break;
					case "detallesVista":
						resolve(await onebox.producto.detallesVista(event.parametros.sesion, event.parametros.vista));
						break;
					case "asientosVista":
						resolve(await onebox.producto.asientosVista(event.parametros.sesion, event.parametros.vista));
						break;
					default:
						//inicio FECHAHORA, fin FECHAHORA
						resolve(await onebox.producto.infoEvento(event.parametros.producto, event.parametros));
				}
				break;
			case "carrito":
				if (event.carrito !== undefined) {
					onebox.carrito = event.carrito;
					switch (event.metodo) {
						case 'anadirNoNumerados':
							resolve(await onebox.cesta.anadirNoNumerada(event.parametros.sesion, event.parametros.tipo, event.parametros.unidades));
							break;
						case 'anadirNumerados':
							//total NUMERO, ratio ID
							resolve(await onebox.cesta.anadirNoNumerada(event.parametros.asientos, event.parametros));
							break;
						case 'mejoresAsientos':
							//vista ID, zona ID, sector ID, zonaNoNumerada ID, total NUMERO, ratio ID
							resolve(await onebox.cesta.anadirMejoresAsientos(event.parametros.sesion, event.parametros.unidades, event.parametros));
							break;
						case 'obtenerPromociones':
							resolve(await onebox.cesta.obtenerPromociones());
							break;
						case 'obtenerPromocionesGrupo':
							//grupo ID
							resolve(await onebox.cesta.obtenerPromocionesGrupo(event.parametros.codigo, event.parametros));
							break;
						case 'aplicarDescuento':
							//forzar BOOL, total NUMERO
							resolve(await onebox.cesta.aplicarDescuento(event.parametros.descuento, event.parametros.elementos, event.parametros));
							break;
						case 'aplicarPromocion':
							//forzar BOOL, total NUMERO
							resolve(await onebox.cesta.aplicarPromocion(event.parametros.promocion, event.parametros.elementos, event.parametros));
							break;
						case 'eliminarDescuento':
							//total NUMERO
							resolve(await onebox.cesta.eliminarDescuento(event.parametros.descuento, event.parametros.elementos, event.parametros));
							break;
						case 'eliminarPromocion':
							//total NUMERO
							resolve(await onebox.cesta.eliminarPromocion(event.parametros.promocion, event.parametros.elementos, event.parametros));
							break;
						case 'cambiarRatios':
							//ratio ID
							resolve(await onebox.cesta.cambiarRatios(event.parametros.items, event.parametros));
							break;
						case 'datosNominativos':
							resolve(await onebox.cesta.datosNominativos(event.parametros.datos));
							break;
						case 'datosCliente':
							//nombre TEXTO, appellidos TEXTO, fechaNacimientoFECHA, telefono TEXTO, nif TEXTO, sexo TEXTO, direccion TEXTO, ciudad TEXTO, codigoPostal TEXTO, pais TEXTO, comunidad TEXTO, aceptaPublicidad TEXTO, emailTicket TEXTO, emailFactura TEXTO, datosSeguro TEXTO, nota TEXTO
							resolve(await onebox.cesta.datosCliente(event.parametros.email, event.parametros));
							break;
						case 'entrega':
							resolve(await onebox.cesta.entrega(event.parametros.tipo, event.parametros.coste));
							break;
						case 'liberar':
							resolve(await onebox.cesta.liberar());
							break;
						default:
							resolve(onebox.generarEstado(-902, "Error carrito", event.parametros));
					}
				} else {
					resolve(await onebox.cesta.crearCarrito());
				}
				break;
			case "pedido":
				if (event.pedido !== undefined) {
					onebox.prerreserva = event.pedido;
					switch (event.metodo) {
						case 'liberar':
							resolve(await onebox.pedido.liberar());
							break;
						case 'confirmar':
							//caducidad FECHANHORA, fraude BOOL, nota TEXTO, idPedido TEXTO
							resolve(await onebox.pedido.confirmar(event.parametros.pago, event.parametros));
							break;
						case 'buscar':
							//desde FECHAHORA, hasta FECHAHORA
							resolve(await onebox.pedido.buscar(event.parametros));
							break;
						case 'verDetalles':
							//barcode TEXTO
							resolve(await onebox.pedido.verDetalles(event.parametros));
							break;
						case 'devolucion':
							//incluirEnvio BOOL, incluirSeguro BOOL, incluirImpuestos BOOL, listadoImpuestos ARRAY, nota TEXTO, idPedido TEXTO
							resolve(await onebox.pedido.devolucion(event.parametros.elementos, event.parametros.pago, event.parametros.cargos, event.parametros));
							break;
						case 'idPedido':
							resolve(await onebox.pedido.idPedido(event.parametros.idPedido));
							break;
						case 'confirmarAlquiler':
							//nota TEXTO, elementos ARRAY, saltarValidacion BOOL
							resolve(await onebox.pedido.confirmarAlquiler(event.parametros));
							break;
						default:
							resolve(onebox.generarEstado(-903, "Error prerreserva", event.parametros));
					}
				} else {
					//elementos, cargos, nota, saltarValidacion
					resolve(await onebox.pedido.crearPrerreserva(event.parametros.tipo, event.parametros));
				}
				break;

			case "tickets":
				if (event.pedido !== undefined) {
					onebox.prerreserva = event.pedido;
					switch (event.metodo) {
						case "pdf":
							//elementos ARRAY, incluirFactura BOOL, agrupar BOOL
							resolve(await onebox.tickets.pdf(event.parametros));
							break;
						case "info":
							//elementos ARRAY, incluirFactura BOOL, agrupar BOOL
							resolve(await onebox.tickets.info(event.parametros));
							break;
					}
				}

			default:
				//tipo, visitante, inicio, fin, sesion, clase, clasePropia, tour, filtros
				resolve(await onebox.general.buscarEventos(event.parametros));
		}
	});

	let datos = await promesa;

	/*datos.codigo {
		101-199: Producto
		201-299: Carrito,
		301-399: Pedidos,
		401-499: Tickets,
		999-999: Errores
	}*/

	const response = {
		statusCode: datos.estado,
		body: datos.body,
		headers: datos.headers !== undefined ? datos.headers : headers
	};


	console.log("Respuesta API: ", response);

	onebox.DB.release();

	response.body = JSON.stringify(response.body);

	return response;
};