import jsonServer from 'json-server'

const PORT = 5000

const server = jsonServer.create()

server.post('/auth/register', (req,res) => {

  const {email, senha, nome} = req.body;
  console.log(email);
  console.log(senha);
  console.log(nome);
})

server.listen(PORT, () => {
  console.log(`ouvindo na porta ${PORT}...`)
})