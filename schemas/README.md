If any field is not defined with the corresponding schema location/query, the field will be set to empty. Some schemas provide alternatives. E.g. location in bioschemas might use PostalAddress, or a nested PostalAddress, so variations are included.

In the case of Course, both Course fields as well as the single nested CourseInstance are considered as possible values. However, the way courses are extracted by index.ts:extractCourses(), each course will contain a single occurrence of CourseInstance, which can be accessed via `hasCourseInstance[0]`

In the case of Course, information from the courseInstance within it will take priority over Course