import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import { MemoryRouter, Routes, Route, useHref } from "react-router";

describe("useHref under a basename", () => {
  describe("to an absolute route", () => {
    it("returns the correct href", () => {
      function Admin() {
        let href = useHref("/invoices");
        return <p>{href}</p>;
      }

      let element = (
        <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
          <Routes>
            <Route path="admin" element={<Admin />} />
          </Routes>
        </MemoryRouter>
      );
      let renderer = createTestRenderer(element);
      renderer.update(element);

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          /app/invoices
        </p>
      `);
    });
  });

  describe("to a child route", () => {
    it("returns the correct href", () => {
      function Admin() {
        let href = useHref("invoices");
        return <p>{href}</p>;
      }
      let element = (
        <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
          <Routes>
            <Route path="admin" element={<Admin />} />
          </Routes>
        </MemoryRouter>
      );
      let renderer = createTestRenderer(element);
      renderer.update(element);

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          /app/admin/invoices
        </p>
      `);
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        function Admin() {
          let href = useHref("invoices");
          return <p>{href}</p>;
        }

        let element = (
          <MemoryRouter basename="/app" initialEntries={["/app/admin/"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );
        let renderer = createTestRenderer(element);
        renderer.update(element);

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app/admin/invoices
          </p>
        `);
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        function Admin() {
          let href = useHref("invoices/");
          return <p>{href}</p>;
        }

        let element = (
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );
        let renderer = createTestRenderer(element);
        renderer.update(element);

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app/admin/invoices/
          </p>
        `);
      });
    });
  });

  describe("to a sibling route", () => {
    it("returns the correct href", () => {
      function Admin() {
        let href = useHref("../dashboard");
        return <p>{href}</p>;
      }

      let element = (
        <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
          <Routes>
            <Route path="admin" element={<Admin />} />
          </Routes>
        </MemoryRouter>
      );
      let renderer = createTestRenderer(element);
      renderer.update(element);

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          /app/dashboard
        </p>
      `);
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        function Admin() {
          let href = useHref("../dashboard");
          return <p>{href}</p>;
        }

        let element = (
          <MemoryRouter basename="/app" initialEntries={["/app/admin/"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );
        let renderer = createTestRenderer(element);
        renderer.update(element);

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app/dashboard
          </p>
        `);
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        function Admin() {
          let href = useHref("../dashboard/");
          return <p>{href}</p>;
        }

        let element = (
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );
        let renderer = createTestRenderer(element);
        renderer.update(element);

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app/dashboard/
          </p>
        `);
      });
    });
  });

  describe("to a parent route", () => {
    it("returns the correct href", () => {
      function Admin() {
        let href = useHref("..");
        return <p>{href}</p>;
      }

      let element = (
        <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
          <Routes>
            <Route path="admin" element={<Admin />} />
          </Routes>
        </MemoryRouter>
      );
      let renderer = createTestRenderer(element);
      renderer.update(element);

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          /app
        </p>
      `);
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        function Admin() {
          let href = useHref("..");
          return <p>{href}</p>;
        }

        let element = (
          <MemoryRouter basename="/app" initialEntries={["/app/admin/"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );
        let renderer = createTestRenderer(element);
        renderer.update(element);

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app
          </p>
        `);
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        function Admin() {
          let href = useHref("../");
          return <p>{href}</p>;
        }

        let element = (
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );
        let renderer = createTestRenderer(element);
        renderer.update(element);

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app/
          </p>
        `);
      });
    });
  });

  describe("with a to value that has more .. segments than the current URL", () => {
    it("returns the correct href", () => {
      function Admin() {
        let href = useHref("../../../dashboard");
        return <p>{href}</p>;
      }

      let element = (
        <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
          <Routes>
            <Route path="admin" element={<Admin />} />
          </Routes>
        </MemoryRouter>
      );
      let renderer = createTestRenderer(element);
      renderer.update(element);

      // This is correct because the basename works like a chroot "jail".
      // Relative <Link to> values cannot "escape" into a higher level URL since
      // they would be linking to a URL that the <Router> cannot render. To link
      // to a higher URL path, use a plain <a>.
      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <p>
          /app/dashboard
        </p>
      `);
    });

    describe("and no additional segments", () => {
      it("returns the correct href", () => {
        function Admin() {
          let href = useHref("../../..");
          return <p>{href}</p>;
        }

        let element = (
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );
        let renderer = createTestRenderer(element);
        renderer.update(element);

        // This is correct because the basename works like a chroot "jail".
        // Relative <Link to> values cannot "escape" into a higher level URL
        // since they would be linking to a URL that the <Router> cannot render.
        // To link to a higher URL path, use a plain <a>.
        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app
          </p>
        `);
      });
    });

    describe("when the URL has a trailing slash", () => {
      it("returns the correct href", () => {
        function Admin() {
          let href = useHref("../../../dashboard");
          return <p>{href}</p>;
        }

        let element = (
          <MemoryRouter basename="/app" initialEntries={["/app/admin/"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );
        let renderer = createTestRenderer(element);
        renderer.update(element);

        // This is correct because the basename works like a chroot "jail".
        // Relative <Link to> values cannot "escape" into a higher level URL
        // since they would be linking to a URL that the <Router> cannot render.
        // To link to a higher URL path, use a plain <a>.
        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app/dashboard
          </p>
        `);
      });
    });

    describe("when the href has a trailing slash", () => {
      it("returns the correct href", () => {
        function Admin() {
          let href = useHref("../../../dashboard/");
          return <p>{href}</p>;
        }

        let element = (
          <MemoryRouter basename="/app" initialEntries={["/app/admin"]}>
            <Routes>
              <Route path="admin" element={<Admin />} />
            </Routes>
          </MemoryRouter>
        );
        let renderer = createTestRenderer(element);
        renderer.update(element);

        expect(renderer.toJSON()).toMatchInlineSnapshot(`
          <p>
            /app/dashboard/
          </p>
        `);
      });
    });
  });
});
