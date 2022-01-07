import fs from 'fs'
import jsonServer from 'json-server'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'

const PORT = 5000
const SECRET_KEY = '123456789'

const server = jsonServer.create()

server.use(bodyParser.urlencoded({extended: true}))
server.use(bodyParser.json())
server.use(jsonServer.defaults());
let userdb = JSON.parse(fs.readFileSync('./db/usuarios.json', 'UTF-8'))

server.post('/auth/register', (req,res) => {

  const {email, senha, nome} = req.body;

  if(emailAlreadyInUse({email}) === true) {
    const status = 401;
    const message = 'E-mail já foi utilizado!';
    res.status(status).json({status, message});
    return
  }

  fs.readFile("./db/usuarios.json", (err,data) =>{
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({status, message})
      return
    };

    var data = JSON.parse(data.toString());

    var last_item_id = data.usuarios.length > 0 ? data.usuarios[data.usuarios.length-1].id : 0;

    data.usuarios.push({id: last_item_id + 1, email, senha, nome});

    fs.writeFile("./db/usuarios.json", JSON.stringify(data), (err, result) => {
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({status, message})
        return
      }
      console.log("User: " + email + " registred")
    });
    userdb = data
  })

  res.status(200).json("Cadastro Realizado")
})

server.post('/auth/login', (req, res) => {

  console.log("login endpoint called; request body:");
  console.log(req.body);

  const {email, senha} = req.body;

  if (!authentication({email, senha})) {
    const status = 401
    const message = 'E-mail ou senha incorretos!'
    console.log('E-mail ou senha incorretos!')
    res.status(status).json({status, message})
    return
  }

  const access_token = createToken(email)
  let user = { ...userdb.usuarios.find(user => user.email === email && user.senha === senha) }

  console.log("Access Token:" + access_token);
  console.log("User:" + user);

  res.status(200).json({access_token})
})

server.get('/userdata',authenticateToken,(req,res) => {
  const data = userdb.usuarios.filter(user => user.email == req.email)
 
  let respobj = {
    usuario: {
      id: data[0].id,
      email: data[0].email,
      nome: data[0].nome,
      favpokemons: data[0].favpokemons
    }
  }
  
  res.json(respobj)
})

server.put('/favpokemon/add',authenticateToken,(req,res) => {
  console.log(req.email)
})

function createToken(payload){
  return jwt.sign(payload, SECRET_KEY)
}

function emailAlreadyInUse({email}){
  return (userdb.usuarios.findIndex(user => user.email === email) !== -1)
}

function authentication({email,senha}){
  var index = userdb.usuarios.findIndex(user => {
    if(user.email === email && user.senha === senha) {
      return true
    }
    return false
  })

  if(index === -1) return false
  else return true
}

function authenticateToken(req,res,next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if(token == null) return res.sendStatus(401)

  jwt.verify(token,SECRET_KEY, (err,email) => {
    if(err) return res.sendStatus(403)

    req.email = email
    next()
  })
}

server.listen(PORT, () => {
  console.log(`ouvindo na porta ${PORT}...`)
})