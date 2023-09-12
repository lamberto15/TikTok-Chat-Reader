const { object, number, string } = require("yup")

const gameSchema = object({
  id: number().integer().required(),
  winnerId: string().nullable().default(null),
  status: string().oneOf(['done', 'invalid', 'ongoing']).required()
})


module.exports = {
  gameSchema
}
