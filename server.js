import fs from 'fs'
import jsonServer from 'json-server'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'

const PORT = 5000
const SECRET_KEY = '123456789'
const expiresIn = '12h'

const server = jsonServer.create()

server.use(bodyParser.urlencoded({extended: true}))
server.use(bodyParser.json())
server.use(jsonServer.defaults());
let userdb = JSON.parse(fs.readFileSync('./usuarios.json', 'UTF-8'))

function createToken(payload){
  return jwt.sign(payload, SECRET_KEY, {expiresIn})
}

function verifyToken(token){
  return  jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ?  decode : err)
}

function emailAlreadyInUse({email}){
  return (userdb.usuarios.findIndex(user => user.email === email) !== -1)
}

function isRegistred({email}){
  return (userdb.usuarios.findIndex(user => user.email === email) !== -1)
}

server.post('/auth/register', (req,res) => {

  const {email, senha, nome} = req.body;

  if(emailAlreadyInUse({email}) === true) {
    const status = 401;
    const message = 'E-mail já foi utilizado!';
    res.status(status).json({status, message});
    return
  }

  fs.readFile("./usuarios.json", (err,data) =>{
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({status, message})
      return
    };

    var data = JSON.parse(data.toString());

    var last_item_id = data.usuarios.length > 0 ? data.usuarios[data.usuarios.length-1].id : 0;

    data.usuarios.push({id: last_item_id + 1, email, senha, nome});

    fs.writeFile("./usuarios.json", JSON.stringify(data), (err, result) => {
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

server.post('/login', (req, res) => {

  console.log("login endpoint called; request body:");
  console.log(req.body);

  const {email, senha} = req.body;
  if (isRegistred({email, senha}) === false) {
    const status = 401
    const message = 'E-mail ou senha incorretos!'
    res.status(status).json({status, message})
    return
  }

  const access_token = createToken({email, senha})
  let user = { ...userdb.usuarios.find(user => user.email === email && user.senha === senha) }
  delete user.senha

  console.log("Access Token:" + access_token);
  console.log("User:" + user);

  res.status(200).json({access_token, user})
})

server.listen(PORT, () => {
  console.log(`ouvindo na porta ${PORT}...`)
})