const fs = require('fs');

/**
 * Function that processes the zipcodes in slcsp.csv to detemine the
 * second lowest cost silver plan for each if possible.  Requires three
 * files to be present in the same directory:
 * 1. slcsp.csv
 * 2. plans.csv
 * 3. zips.csv
 *
 * It is assumed the formats of each file are known and will not change.
 *
 * After processing, the function writes the values to the console.
 */
const process = () => {
  let plans  = fs.readFileSync('plans.csv');
  let zips   = fs.readFileSync('zips.csv');
  let target = fs.readFileSync('slcsp.csv');

  plans = plans.toString().split('\n');
  let silverPlans = toArrayOfObjs(plans);

  //Get only the silver plans
  silverPlans = silverPlans.filter(plan => {
    return plan['metal_level'] === 'Silver';
  });

  target = target.toString().split('\n');
  zips   = zips.toString().split('\n');

  let targetArray = toArrayOfObjs(target);
  let zipArray    = toArrayOfObjs(zips);

  //If the file read included a blank line at the end get rid of it
  targetArray = targetArray.filter(target => !isNaN(parseInt(target.zipcode)));

  zipArray = zipArray.filter(zip => {
    //Filter out any entries from the zipcodes list that aren't needed in the slcsp file
    let needed = targetArray.find(target => {
      return target.zipcode === zip.zipcode;
    });

    if(needed) {
      return true;
    }

    return false;
  });

  //Loop through the list of zipcodes needed in the slcsp file and get the rate if possible
  for(let i=0; i<targetArray.length; ++i) {
    let currentTarget = targetArray[i];

    //Get the rate area that is associated with the current zipcode
    let currentTargetRateAreaList = zipArray.filter(zip => {
      return zip.zipcode === currentTarget.zipcode;
    });

    //Get all the rate area numbers found
    let dupeCheck = currentTargetRateAreaList.map(rate => rate.rate_area);
    //Make it a unique list
    dupeCheck = [...new Set(dupeCheck)];
    //If there is no rate information for a zipcode or if the zipcode is in more than one rate area skip it
    //Otherwise continue with the processing
    if(dupeCheck.length === 1) {

      //Get the plans with the same rate area and state as the current zipcode
      let currentTargetPlans = silverPlans.filter(plan => {
        //First find all the matching rate areas
        let inArea = currentTargetRateAreaList.find(area => parseInt(area.rate_area) === parseInt(plan.rate_area));
        if(inArea) {
          return true;
        }

        return false;
      })
      .filter(plan => {
        //Then filter out rate areas that are in a different state than the currnt zipcode
        let inState = currentTargetRateAreaList.find(area => area.state === plan.state);
        if(inState) {
          return true;
        }

        return false;
      })
      .sort((left, right) => {
        //Sort the plans from cheapest to most expensive
        return parseInt(left.rate) - parseInt(right.rate);
      });

      //If there aren't at least two plans we don't know what the second lowest cost silver plan is so leave that value blank
      //Otherwise take the second entry in the array
      if(currentTargetPlans.length >= 2) {
        currentTarget.rate = parseFloat(currentTargetPlans[1].rate).toFixed(2);
      }
    }
  }

  console.log('zipcode,rate');
  targetArray.forEach(info => console.log(`${info.zipcode},${info.rate}`));
}

/**
 * Function that takes in an array of rows from a csv and returns an array
 * of JSON-esque objects. Note that the first element in the provided array
 * must be the headers and the number of headers must match the number of
 * properties expected in each object.
 * @param {Array} stringArray The array of csv rows, the first element being the headers
 * @returns Returns an array of JSON-esque objects, each matching a row from the csv
 */
const toArrayOfObjs = (stringArray) => {
  let objArray = [];
  let headers = stringArray[0].split(',');

  for(let i=1; i<stringArray.length; ++i) {
    let obj = {};
    let currentLine = stringArray[i].split(',');

    for(let j=0; j<headers.length; ++j) {
      obj[headers[j]] = currentLine[j];
    }

    objArray.push(obj);
  }

  return objArray;
}

process();
