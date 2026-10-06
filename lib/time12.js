// "16:00" -> "4:00 pm". client.hours.opens/closes (src/_data/client.js) are
// stored 24-hour because that is the format schema.org's
// OpeningHoursSpecification requires; this renders them for guests. Shared by
// the `time12` filter (.eleventy.js) and the FAQ answers (src/_data/faq.js),
// which are built in JavaScript and never see a filter.
module.exports = function time12(value) {
  const [h, m] = String(value).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};
