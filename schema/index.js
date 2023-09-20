const { object, number, string, array } = require("yup")


const gameSchema = object({
  id: number().integer().required(),
  msgIds: array().of(string().required()).nullable().default(null),
  winnerId: string().nullable().default(null),
  status: string().oneOf(['done', 'invalid', 'ongoing']).required()
})


module.exports = {
  gameSchema
}
