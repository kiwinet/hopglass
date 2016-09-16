define(function () {
  return function (config) {
    var self = this
    var stats, timestamp

    self.setData = function (d) {
      var totalNodes = sum(d.nodes.all.map(one))
      var totalOnlineNodes = sum(d.nodes.all.filter(online).map(one))
      var totalOfflineNodes = sum(d.nodes.all.filter(function (node) {return !node.flags.online}).map(one))
      var totalNewNodes = sum(d.nodes.new.map(one))
      var totalLostNodes = sum(d.nodes.lost.map(one))
      var totalClients = sum(d.nodes.all.filter(online).map( function (d) {
        return d.statistics.clients ? d.statistics.clients : 0
      }))
      var totalGateways = sum(Array.from(new Set(d.nodes.all.filter(online).map( function(d) {
        return ("gateway" in d.statistics && d.statistics.gateway.id) ? d.statistics.gateway.id : d.statistics.gateway
      }).concat(d.nodes.all.filter( function (d) {
        return d.flags.gateway
      })))).map(function(d) {
        return (typeof d === "string") ? 1 : 0
      }))

      var nodetext = [{ count: totalOnlineNodes, label: "įjungti" },
                      { count: totalOfflineNodes, label: "išjungti" },
                      { count: totalNewNodes, label: "nauji" },
                      { count: totalLostNodes, label: "dingę" }
                     ].filter( function (d) { return d.count > 0 } )
                      .map( function (d) { return [d.count, d.label].join(" ") } )
                      .join(", ")

      stats.textContent = totalNodes + " Mazgai " +
                          "(" + nodetext + "), " +
                          totalClients + " Klient" + ( totalClients === 1 ? "as, " : "ų, " ) +
                          totalGateways + " Maršrutizatori" + ( totalGateways === 1 ? "us" : "ų" )

      timestamp.textContent = "Duomenys atnaujiniti: " + d.timestamp.format("LLLL") + "."
    }

    self.render = function (el) {
      var h2 = document.createElement("h2")
      h2.textContent = config.siteName
      el.appendChild(h2)

      var p = document.createElement("p")
      el.appendChild(p)
      stats = document.createTextNode("")
      p.appendChild(stats)
      p.appendChild(document.createElement("br"))
      timestamp = document.createTextNode("")
      p.appendChild(timestamp)
    }

    return self
  }
})
