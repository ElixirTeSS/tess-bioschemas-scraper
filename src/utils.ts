
const jsonata = require("jsonata");


/**
 * Given a json containing schema objects returns an array of
 * elements (events, materials, or any other approved content)
 * WARNING! When modifying the query, consider possible combinations of nested elements
 * We want to check recursively, to process all json structure types (wae extraction nests
 * results into categories already). However, we want to avoid extracting redundant elements.
 * E.g. CoursesInstances within Courses, as well as on their own
 * Current logic extracts:
 * 1. Any Event and Course
 * 2. Removes CourseInstances nested within a Course
 * 3. Looks for CourseInstances
 * Any example query can be tested in https://try.jsonata.org/ using the test files and given example queries
 * @param input json object containing schema objects
 */
 export function jsonExtractContent(input) {
  // Example query to extract all event and course objects
  // **[`@type` in ["Event","Course"]];
  // $[] looks into the root attributes, while **[] checks recursively all nested
  // Example where only root elements are checked
  // $[`@type` in ["Event","Course","CourseInstance"]]
  // Finishing the expression with "[]" ensures it returns an array, even if there is a single result
  // Extract courses

  // WHAT about replacing the type field for the elements within Course?

  /** TODO: Find a way to consistently extract CourseInstances whose parent is not Course,
   * so mixed inputs can be handled. Alternatively, find a way to delete already extracted elements from input,
   * so the same content is not retrieved twice.
   * At the moment, we extract parent structures, and only look for possible nested ones if results comes empty
   */
  const courseArray = jsonata('**[`@type` in ["Event","Course"]][]').evaluate(input) || [];
  // Filter all CourseInstances from the already extracted courses, by replacing hasCourseInstance
  const newInput = jsonata('$ ~> |$[`@type`="Course"]|{"hasCourseInstance":"none"}|').evaluate(input);
  // extract additional elements
  return courseArray.concat(jsonata('**[`@type` in ["CourseInstance"]][]').evaluate(newInput) || []);
}

/**
 * Processes courses and extracts courseinstances, keeping the course information.
 * This way each courseInstance also contains all its parent's (course) information
 * WARNING: If a course doesn't contain any courseinstance child, an empty array is returned
 * effectively ignoring the course as a whole.
 * @param input course type object
 * @returns array of course objects, including a single course instance object
 */
export function extractCourses(input) {
  // Given a single course object, create new course objects for each of the contained courseInstances
  // Adding "[]" at the end of the jsonata query ensures the result is an array
  const expression = jsonata('**[`@type` in ["CourseInstance"]][]');

  const instanceCount = expression.evaluate(input).length;
  let courseWithInstanceArray = [];
  for (const index of [...Array(instanceCount).keys()]) {
    // Keeps all the root attributes, with an additional single courseInstance
    // https://docs.jsonata.org/other-operators transform operator ~>
    // https://try.jsonata.org/Y0Qes2qkS
    const expression = jsonata(`$ ~> |$|{'hasCourseInstance': hasCourseInstance[${index}]}|`);
    courseWithInstanceArray = [...courseWithInstanceArray, expression.evaluate(input)];
  }
  return courseWithInstanceArray;
}