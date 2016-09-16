define(["chroma-js", "virtual-dom", "numeral-intl", "filters/genericnode", "vercomp" ],
  function (Chroma, V, numeral, Filter, vercomp) {

  return function (config, filterManager) {
    var self = this
    var scale = Chroma.scale("YlGnBu").mode("lab")

    var statusTable = document.createElement("table")
    statusTable.classList.add("proportion")

    var fwTable = document.createElement("table")
    fwTable.classList.add("proportion")

    var hwTable = document.createElement("table")
    hwTable.classList.add("proportion")

    var geoTable = document.createElement("table")
    geoTable.classList.add("proportion")

    var autoTable = document.createElement("table")
    autoTable.classList.add("proportion")

    var uplinkTable = document.createElement("table")
    uplinkTable.classList.add("proportion")

    var  gwNodesTable = document.createElement("table")
    gwNodesTable.classList.add("proportion")

    var gwClientsTable = document.createElement("table")
    gwClientsTable.classList.add("proportion")

    var siteTable = document.createElement("table")
    siteTable.classList.add("proportion")

    function showStatGlobal(o) {
      return showStat(o)
    }

    function count(nodes, key, f) {
      var dict = {}

      nodes.forEach( function (d) {
        var v = dictGet(d, key.slice(0))

        if (f !== undefined)
          v = f(v)

        if (v === null)
          return

        dict[v] = 1 + (v in dict ? dict[v] : 0)
      })

      return Object.keys(dict).map(function (d) { return [d, dict[d], key, f] })
    }

    function countClients(nodes, key, f) {
      var dict = {}

      nodes.forEach( function (d) {
        var v = dictGet(d, key.slice(0))

        if (f !== undefined)
          v = f(v)

        if (v === null)
          return

        dict[v] = d.statistics.clients + (v in dict ? dict[v] : 0)
      })

      return Object.keys(dict).map(function (d) { return [d, dict[d], key, f] })
    }


    function addFilter(filter) {
      return function () {
        filterManager.addFilter(filter)

        return false
      }
    }

    function fillTable(name, table, data) {
      if (!table.last)
        table.last = V.h("table")

      var max = 0
      data.forEach(function (d) {
        if (d[1] > max)
          max = d[1]
      })

      var items = data.map(function (d) {
        var v = d[1] / max
        var c1 = Chroma.contrast(scale(v), "white")
        var c2 = Chroma.contrast(scale(v), "black")

        var filter = new Filter(name, d[2], d[0], d[3])

        var a = V.h("a", { href: "#", onclick: addFilter(filter) }, d[0])

        var th = V.h("th", a)
        var td = V.h("td", V.h("span", {style: {
                                         width: Math.round(v * 100) + "%",
                                         backgroundColor: scale(v).hex(),
                                         color: c1 > c2 ? "white" : "black"
                                       }}, numeral(d[1]).format("0,0")))

        return V.h("tr", [th, td])
      })

      var tableNew = V.h("table", items)
      table = V.patch(table, V.diff(table.last, tableNew))
      table.last = tableNew
    }

    self.setData = function (data) {
      var onlineNodes = data.nodes.all.filter(online)
      var nodes = onlineNodes.concat(data.nodes.lost)
      var nodeDict = {}

      data.nodes.all.forEach(function (d) {
        nodeDict[d.nodeinfo.node_id] = d
      })

      var statusDict = count(nodes, ["flags", "online"], function (d) {
        return d ? "online" : "offline"
      })
      var fwDict = count(nodes, ["nodeinfo", "software", "firmware", "release"])
      var hwDict = count(nodes, ["nodeinfo", "hardware", "model"], function (d) {
        if (d) {
          d = d.replace(/\(r\)|\(tm\)/gi, "").replace(/AMD |Intel |TP-Link | CPU| Processor/g, "")
          if (d.indexOf("@") > 0) d = d.substring(0, d.indexOf("@"))
        }
        return d
      })
      var geoDict = count(nodes, ["nodeinfo", "location"], function (d) {
        return d && d.longitude && d.latitude ? "taip" : "ne"
      })

      var autoDict = count(nodes, ["nodeinfo", "software", "autoupdater"], function (d) {
        if (d === null)
          return null
        else if (d.enabled)
          return d.branch
        else
          return "(išjungtas)"
      })

      var uplinkDict = count(nodes, ["flags", "uplink"], function (d) {
        return d ? "taip" : "ne"
      })

      var gwNodesDict = count(onlineNodes, ["statistics", "gateway"], function (d) {
        if (d === null)
          return null

        if (d.node)
          return d.node.nodeinfo.hostname

        if (d.id)
          return d.id

        return d
      })

      var gwClientsDict = countClients(onlineNodes, ["statistics", "gateway"], function (d) {
        if (d === null)
          return null

        if (d.node)
          return d.node.nodeinfo.hostname

        if (d.id)
          return d.id

        return d
      })

      var siteDict = count(nodes, ["nodeinfo", "system", "site_code"], function (d) {
        var rt = d
        if (config.siteNames)
          config.siteNames.forEach( function (t) {
            if(d === t.site)
              rt = t.name
          })
        return rt
      })

      fillTable("Statusas", statusTable, statusDict.sort(function (a, b) { return b[1] - a[1] }))
      fillTable("Firmware", fwTable, fwDict.sort(function (a, b) { return vercomp(b[0], a[0]) }))
      fillTable("Įranga", hwTable, hwDict.sort(function (a, b) { return b[1] - a[1] }))
      fillTable("Koordinatės", geoTable, geoDict.sort(function (a, b) { return b[1] - a[1] }))
      fillTable("Uplink", uplinkTable, uplinkDict.sort(function (a, b) { return b[1] - a[1] }))
      fillTable("Atnaujinimas", autoTable, autoDict.sort(function (a, b) { return b[1] - a[1] }))
      fillTable("Maršrutizatorius", gwNodesTable, gwNodesDict.sort(function (a, b) { return b[1] - a[1] }))
      fillTable("Maršrutizatorius", gwClientsTable, gwClientsDict.sort(function (a, b) { return b[1] - a[1] }))
      fillTable("Vieta", siteTable, siteDict.sort(function (a, b) { return b[1] - a[1] }))
    }


    self.render = function (el) {
      var h2
      self.renderSingle(el, "Statusai", statusTable)
      self.renderSingle(el, "Maršrutizatoriai (Mazgų skaičius)", gwNodesTable)
      self.renderSingle(el, "Maršrutizatoriai (Klientų skaičius)", gwClientsTable)
      self.renderSingle(el, "Firmware Versijos", fwTable)
      self.renderSingle(el, "Uplink statusai", uplinkTable)
      self.renderSingle(el, "Įrangos versijos", hwTable)
      self.renderSingle(el, "Matomumas žemėlapyje", geoTable)
      self.renderSingle(el, "Atnaujinimai", autoTable)
      self.renderSingle(el, "Vietos", siteTable)

      if (config.globalInfos)
        config.globalInfos.forEach(function (globalInfo) {
          h2 = document.createElement("h2")
          h2.textContent = globalInfo.name
          el.appendChild(h2)
          el.appendChild(showStatGlobal(globalInfo))
        })
      }

    self.renderSingle = function (el, heading, table) {
       var h2
       h2 = document.createElement("h2")
       h2.textContent = heading
       h2.onclick = function () {
         table.classList.toggle("hidden")
       }
       el.appendChild(h2)
       el.appendChild(table)
     }
     return self
  }
})
