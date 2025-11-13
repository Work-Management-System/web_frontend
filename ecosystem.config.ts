module.exports = {
  apps : [{
    name: "worksheet.management",
    script: "npm",
    args: "start",
    watch: true,
    env: {
	  PORT: 4000
    }
  }]
}
