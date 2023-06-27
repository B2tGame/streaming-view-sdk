/* eslint-disable no-unused-vars */
/**
 * PredictGameExperienceBase class
 */
export default class PredictGameExperienceBase {
  predict(roundTripTime: number, packageLostPercentage?: number) {
    throw new Error('You must override PredictGameExperienceBase.predict function');
  }
}
