const jsonExtractContent = require("../src/utils").jsonExtractContent;

const course_test = require('../test/Course-mixed-test.json');

describe('testing extractContent', () => {
  test('mixed Courses contain 2 elements', () => {
    expect(jsonExtractContent(course_test).length).toBe(2);
  });
});