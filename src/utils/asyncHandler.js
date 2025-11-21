const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error));
  };
};

export default asyncHandler;




// The below are the steps how higher order function works
// const asyncHandler = (fn) => {}
// const asyncHandler = (fn) => { () => {} }
// const asyncHandler = (fn) => () => {}

// Below is the try catch implementation of asyncHandler
/*
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message });
    }
}
*/
