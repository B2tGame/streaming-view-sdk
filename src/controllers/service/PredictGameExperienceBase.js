/* eslint-disable no-unused-vars */
/**
 * PredictGameExperienceBase class
 */
export default class PredictGameExperienceBase {
  predict(roundTripTime, packageLostPercentage = undefined) {
    throw new Error('You must override PredictGameExperienceBase.predict function');
  }
}
