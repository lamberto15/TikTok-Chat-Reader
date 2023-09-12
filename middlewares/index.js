const { ValidationError } = require("yup")

const validate = (schema) => async (req, res, next) => {
  try {
    const validated = await schema.validate(req.body, { stripUnknown: true, abortEarly: false })
    req.body = validated
    next()
  } catch (error) {
    if (error instanceof ValidationError) {
      const errors = {}
      error.inner.forEach(field => errors[field.path] = field.message)
      res.status(422).json({
        errors
      })
    }
  }

}


module.exports = {
  validate
}