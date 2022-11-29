var express = require('express');
var bodyParser = require('body-parser') ;
var app = express();
//const handlebars = require('express-handlebars');
var PORT = 3000;

//carregado helps de logado 

const {eAdmin} = require("./helpers/eAdmin")

//app.engine('handlebars' , handlebars.engine({defaultLayout : 'main'}))
//app.set('view engine', 'handlebars')

const flash = require('connect-flash');

// trazendo contato_db
const Post_postagens = require('./models/contato_db');
const { response, application } = require('express');

//cadastro bd
const Post_cadastro = require('./models/clientes_bd');
const Post_produtos = require('./models/produtos_bd');
const Post_carrinho = require('./models/carrinho_bd');

//login engine
const passport = require("passport");
const session = require('express-session');
require("./config/auth")(passport);

//sessão
app.use(session({
  secret: "cursodenode",
  resave: true,
  saveUninitialized: true ,
  cookie : { maxAge: (1000 * 60 * 100) }
}))
app.use(flash())

app.use(passport.initialize())
app.use(passport.session())


//middleware login engine flash message
app.use((req , res , next ) =>{
  res.locals.sussess_msg = req.flash("sucess_msg")
  res.locals.error_msg = req.flash("error_msg")
  res.locals.error = req.flash("error")
  res.locals.user = req.user || null;
  res.locals.usuario = req.usuario || null;
  next()
})

//app.locals.user = user || null;

// View engine setup
app.set('view engine', 'ejs');
//configurando body parser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
 
//add pasta publica
app.use(express.static('./public'));

//jason
app.use(express.json()) ;


// Without middleware
app.get('/home', function(req, res){
    // Rendering home.ejs page
    res.render('home');
})

app.get('/', function(req, res){
  res.render('home');
})

app.get('/login', function(req, res){
  // Rendering home.ejs page
  res.render('login');
})

app.get('/cadastrarnovasenha', function(req, res){
  res.render('cadastrarnovasenha');
})

app.get('/base', function(req, res){
  res.render('base');
})

app.get('/login_erro', function(req, res){
  res.render('login_erro');
})


app.get('/cadastro', function(req, res){
  res.render('cadastro');
})

app.get('/carrinho_original', eAdmin ,function(req, res ){
  Post_carrinho.findAll(
    {
      where: {cliente_id: res.locals.user.id},
      include: [{model:Post_produtos}]
    }
    ).then((carrinho) => {
      const viewcart = carrinho.map(viewitem => {
        return{
          id: viewitem.id,
          prodID: viewitem.produto_id,
          prodqtt: viewitem.quantidade,
          prodnome: viewitem.produto.nome,
          prodimg: viewitem.produto.urlimagem,
          descricao: viewitem.produto.descricao,
          valor: viewitem.produto.valor,
          userID: viewitem.cliente_id
        }
      })
     // res.status(200).send(selah)
    res.render('carrinho', {carrinho: viewcart})
    }).catch((err) =>{
    //console.log("error ao listar produtos")
    res.redirect("/login")
    })
})

const db = require ('./models/db');

app.get('/carrinho', eAdmin ,function(req, res ){
  Post_carrinho.findAll(
    {
      where: {cliente_id: res.locals.user.id},
      include: [{model:Post_produtos}]
    }
    ).then((carrinho) => {
      const viewcart = carrinho.map(viewitem => {
        return{
          id: viewitem.id,
          prodID: viewitem.produto_id,
          prodqtt: viewitem.quantidade,
          prodnome: viewitem.produto.nome,
          prodimg: viewitem.produto.urlimagem,
          descricao: viewitem.produto.descricao,
          valor: viewitem.produto.valor,
          userID: viewitem.cliente_id
        }
      })
      total_item_q="SELECT sum(total_cart.total_item) as total_item from "
      +"(SELECT SUM(c.quantidade) * p.valor AS total_item FROM carrinhos c "
      +" , produtos p WHERE c.cliente_id = 1 AND c.produto_id = p.id GROUP BY produto_id ) total_cart"
      total_cart_q="SELECT sum(total_cart.total_item) as total_cart from "
      +"(SELECT SUM(c.quantidade) * p.valor AS total_item "
      + "FROM carrinhos c , produtos p WHERE c.cliente_id = 1 AND c.produto_id = p.id " 
      + "GROUP BY produto_id) total_cart ; "
      const executaproc = async (course) => {
      const cmdline = await db.sequelize.query(total_cart_q) 
          return cmdline;      
          }
              let total_cart_prod = executaproc();
              total_cart_prod.then(r => {
              console.log(r)
             res.render('carrinho', {
              carrinho: viewcart , 
              total_cart: r
            })
               return r 
             })
        }).catch((err) =>{
        res.redirect("/login")
        })

})


app.get("/carrinho_amigo", eAdmin, async (req, res) => {
  try {
    const carrinho = Post_carrinho.findAll({
      where: { cliente_id: res.locals.user.id },
      include: [{ model: Post_produtos }],
    });
    carrinho.map((viewitem) => {
      let obj = {
        id: viewitem.id,
        prodID: viewitem.produto_id,
        prodqtt: viewitem.quantidade,
        prodnome: viewitem.produto.nome,
        prodimg: viewitem.produto.urlimagem,
        descricao: viewitem.produto.descricao,
        valor: viewitem.produto.valor,
        userID: viewitem.cliente_id,
      };
      return obj;
    });
    total_item_q =
      "SELECT sum(total_cart.total_item) as total_item from " +
      "(SELECT SUM(c.quantidade) * valor AS total_item FROM carrinhos c " +
      " , produtos p WHERE c.cliente_id = 1 AND c.produto_id = p.id GROUP BY produto_id ) total_cart"
    total_cart_q =
      "SELECT sum(total_cart.total_item) as total_cart from " +
      "(SELECT SUM(c.quantidade) * valor AS total_item " +
      "FROM carrinhos c , produtos p WHERE c.cliente_id = 1 AND c.produto_id = p.id " +
      "GROUP BY produto_id) total_cart ; "
    const executaproc = async (course) => {
      const cmdline = await db.sequelize.query(total_cart_q);
      return cmdline;
    };
    let total_cart_prod = await executaproc();

    res.render("carrinho", {
      carrinho: viewcart,
      total_cart: total_cart_prod,
    });
  } catch (e) {
    res.redirect("/login")
  }
});

app.get('/ordem_compra', eAdmin ,function(req, res ){
  Post_carrinho.findAll(
    {
      where: {cliente_id: res.locals.user.id},
      include: [{model:Post_produtos}]
    }
    ).then((carrinho) => {
      const viewcart = carrinho.map(viewitem => {
        return{
          id: viewitem.id,
          prodID: viewitem.produto_id,
          prodqtt: viewitem.quantidade,
          prodnome: viewitem.produto.nome,
          prodimg: viewitem.produto.urlimagem,
          descricao: viewitem.produto.descricao,
          valor: viewitem.produto.valor,
          userID: viewitem.cliente_id
        }
      })
      total_item_q="SELECT sum(total_cart.total_item) as total_item from "
      +"(SELECT SUM(c.quantidade) * valor AS total_item FROM carrinhos c "
      +" , produtos p WHERE c.cliente_id = 1 AND c.produto_id = p.id GROUP BY produto_id ) total_cart"
      total_cart_q="SELECT sum(total_cart.total_item) as total_cart from "
      +"(SELECT SUM(c.quantidade) * valor AS total_item "
      + "FROM carrinhos c , produtos p WHERE c.cliente_id = 1 AND c.produto_id = p.id " 
      + "GROUP BY produto_id) total_cart ; "
      const executaproc = async (course) => {
      const cmdline = await db.sequelize.query(total_cart_q) 
          return cmdline;      
          }
              let total_cart_prod = executaproc();
              total_cart_prod.then(r => {
              console.log(r)
               return r 
             })
        res.render('carrinho', {
          carrinho: viewcart , 
          total_cart: total_cart_prod.then(console.log)
        })
        }).catch((err) =>{
        res.redirect("/login")
        })

})



app.post("/add_carinho", eAdmin ,function(request, response, next){
  Post_carrinho.create({
    produto_id: request.body.prodID,
    cliente_id: request.body.userID,
    quantidade: '1'
  }).then(function(){
    //response.send("Post criado com sucesso")
    response.redirect("/produto")
  }).catch(function(error){
    response.send("ocorreu um erro" + error)
  })
});


app.post('/del_carrinho', eAdmin ,function(request, response ){
  Post_carrinho.destroy(
    {
      where: {cliente_id: response.locals.user.id , produto_id: request.body.prodID , id: request.body.id }
    }).then(function(){
      //response.send("Post criado com sucesso")
      response.redirect("/carrinho")
    }).catch(function(error){
      response.send("ocorreu um erro" + error)
    })
})

app.get('/cliente', eAdmin , function(req, res){
  res.render('cliente');
})

app.get('/cliente_contatos', eAdmin , function(req, res){
  res.render('cliente_contatos');
})

app.get('/cliente_dados', eAdmin , function(req, res){
  res.render('cliente_dados');
})

app.get('/cliente_endereco', eAdmin , function(req, res){
  res.render('cliente_endereco');
})

app.get('/cliente_favoritos', eAdmin , function(req, res){
  res.render('cliente_favoritos');
})

app.get('/cliente_pedidos', eAdmin , function(req, res){
  res.render('cliente_pedidos');
})

app.get('/cliente_senha', eAdmin , function(req, res){
  res.render('cliente_senha');
})

app.get('/confirmcadastrosenha' , function(req, res){
  res.render('confirmcadastrosenha');
})

app.get('/confirmcontato', function(req, res){
  res.render('confirmcontato');
})

app.get('/confirmrecupsenha', function(req, res){
  res.render('confirmrecupsenha');
})

app.get('/contato', function(req, res){
  res.render('contato');
})

app.get('/fechamento_endereco', eAdmin , function(req, res){
  res.render('fechamento_endereco');
})

app.get('/fechamento_itens', eAdmin , function(req, res){
  res.render('fechamento_itens');
})

app.get('/fechamento_pagamento', eAdmin , function(req, res){
  res.render('fechamento_pagamento');
})

app.get('/produto', function(req, res ){
  Post_produtos.findOne({where: {id: 1}}).then((produto) => {
    var imgName = produto.urlimagem
    res.render('produto', {produto: produto, imgName: imgName} )
  }).catch((err) =>{
    console.log("error ao listar produtos")
    res.redirect("/home")
  } )
})

app.get('/fechamento_pedido', eAdmin , function(req, res){
  res.render('fechamento_pedido');
})

app.post("/logindkf", (req , res , next) => {
  passport.authenticate("local", {
    successRedirect: ("/cliente") ,
    failureRedirect: "/login_erro",
    failureFlash: true   
  })(req , res , next)
});

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
      req.flash('success_msg', "Deslogado com sucesso!")
      res.redirect("/")
  })
})

app.post("/contato_rota", function(request, response, next){
  Post_postagens.create({
    nome: request.body.txtNomeCompleto,
    email: request.body.txtEmail,
    mensagem: request.body.txtMensagem
  }).then(function(){
    //response.send("Post criado com sucesso")
    response.redirect('/home')
  }).catch(function(error){
    response.send("ocorreu um erro" + error)
  })
});

app.post("/cadastro_rota", function(request, response, next){
  Post_cadastro.create({
    nome: request.body.txtNome,
    cpf: request.body.txtCPF,
    nascimento: request.body.txtDataNascimento,
    email: request.body.txtEmail,
    telefone: request.body.txtTelefone,
    cep: request.body.txtCEP,
    numero: request.body.txtNumero,
    rua: request.body.txtNome,
    complemento: request.body.txtComplemento,
    referencia: request.body.txtReferencia,
    password: request.body.txtSenha
  }).then(function(){
    ///response.send("Cliente cadastrado com sucesso")
    response.redirect('/cliente')
  }).catch(function(error){
    response.send("ocorreu um erro" + error)
  })
});

 app.listen(PORT, function(err){

    if (err) console.log(err);

    console.log("Server listening on PORT", PORT);
});
