## AGENTS

Proyecto: Mercería Conchi

Agente: eres un desarrollador web especializado con más de 15 años de experiencia en el desarrollo de tiendas online y aplicaciones web.
Tú objetivo es ayudarme a finalizar este proyecto sin romper nada de la lógica que ya tenemos implementada.


## REGLAS

1. No romper nada de la lógica que ya tenemos implementada.
2. Todo debe seguir el diseño establecido hasta el momento paar el desarrollo de la parte visial de la web.

Función del proyecto:
Conchi tiene una mercería, que se llama Meraki ArteSano. Quiere una web que tenga un pequeña tienda, a la que añadirá unas 10 referencias aproximadamente. Además, quiere que su web tenga la función principal de que sirva como academia online para las personas que se suscriban, esa academia la hemos llamado "Club Meraki ArteSano". El proyecto esta en su fase final de desarrollo, y solo quiero modificar textos que no me gusten como se han quedado, modificar algunas imagenes, y sobre todo, lo más importante, es cambiar el sistema de cobros usando Redsys, hasta ahora esta implementado con Stripe, pero la clienta me comunicó que prefiere usar Redsys, por el momento estoy a la espera de que me de los datos que necesito, que si no me equivoco son:

- La clienta → Habla con Caja Rural Central y pide activar el TPV Virtual para su web
- El banco → Activa el servicio y le da las credenciales (Nº Comercio, Nº Terminal, Clave Secreta)
- La clienta nos da esas credenciales → Y nosotros hacemos toda la parte técnica
- Nosotros → No necesitamos registrarnos en ningún sitio.

Tambien me gustaría hacer uan modificación en la parte de la tienda, puesto que usando vibe coding se me crearon unas categorias de productos, pero me gustaría implementarlo de tal forma que sea la clienta la que pueda crear las categorias que necesite, en lugar de darselas ya establecidas.  

Nuevas funciones que me gustaría implementar a día 25/03/2026:
1. Botón de WhatsApp para contactar con la tienda, la clienta quiere que aparezca en la parte inferior derecha de la pantalla un botoncito con el logo de WhatsApp, que al hacer clic, abra una ventana de chat con la tienda, o si se hace desde el móvil, que abra la aplicación de WhatsApp con una ventana de chat con la tienda. El número de teléfono es el 605 88 99 38.
2. Añadir tambien la tradución al idioma Portugués, siguiendo el mismo patrón y estetica de las traducciones ya implementadas.
3. Añadir la opción de envíos a Francia, siguiendo el mismo patrón y estetica de los envíos ya implementados. Es añadir un país más a la lista de países a los que se hacen envíos.
4. Añadir la opción de recoger pedidos en tienda, ya sea de los pedidos realizados en la tienda online, o de los pedidos realizados en la academia online. 
5. Necesitamos que en el proceso de alta de nuevo alumno de la academia, se piedan todos los datos necesarios para poder hacer en envío del kit de cada clase, que son: Nombre, Apellidos, Dirección, Código Postal, Ciudad, Provincia, País y Teléfono, y que estos datos se guarden en la base de datos, en la tabla de alumnos, y permitirles recoger el pedido del kit en tienda. También que el alumno tenga acceso a sus datos para modificarlos cuando quiera.
6. Necesitamos que en el proceso de alta del nuevo alumno se haga el pago de la suscripción, y solamente pueda acceder a los contenidos de la academia cuando se haya realizado el pago. 