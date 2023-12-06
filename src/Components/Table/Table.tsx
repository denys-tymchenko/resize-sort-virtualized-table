/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { TableVirtuoso, TableVirtuosoHandle } from 'react-virtuoso';
import { sortBy } from '../../Utils';
import { SortState, TableProps, TableSchema } from './types';
import Icon from '../Icon';

import './style.css';

const minColWidth = 100;

const Table = <DataType extends {}>({
  data: source = [],
  schema,
  manualSort = true,
  rowHeight = 72,
  headerHeight = 72,
  onCellClick,
  rowClassMap,
  wrapperRef
}: TableProps<DataType>) => {
  const [sortState, setSortState] = useState<SortState | undefined>();
  const [colWidths, setColWidths] = useState<{ [prop: string]: number }>({});
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [rootWidth, setRootWidth] = useState<number>();

  const resizeColIndexRef = useRef<number>(-1);
  const headerRef = useRef<HTMLTableRowElement>(null);
  const tableRef = useRef<TableVirtuosoHandle>(null);
  const scrollWidthRef = useRef<number | undefined>(undefined);
  const resizeObserverRef = useRef<ResizeObserver>();

  useEffect(() => {
    const defaultWidths = schema.reduce<{ [colIndex: number]: number }>((acc, item, index) => {
      const isResizable = typeof item.resizable === 'undefined' || item.resizable;
      return {
        ...acc,
        [item.prop]: isResizable
          ?
          typeof item.width === 'number' && item.width >= minColWidth ? item.width : minColWidth
          :
          item.width ?? minColWidth
      };
    }, {});
    setColWidths(defaultWidths);

    const root = wrapperRef?.current;
    if (root) {
      resizeObserverRef.current = new ResizeObserver((entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.target === root) {
            setRootWidth(Math.floor(entry.contentRect.width));
            break;
          }
        }
      });
      resizeObserverRef.current.observe(root);
    }

    document.onmousemove = handleOnMouseMove;
    document.onmouseup = handleOnMouseUp;

    return () => {
      document.onmousemove = null;
      document.onmouseup = null;
      document.body.style.cursor = 'auto';
      root && resizeObserverRef.current?.unobserve(root);
    };
  }, []);

  useEffect(() => {
    const root = wrapperRef?.current;
    if (root && rootWidth) {

      const widthIterator = Object.entries(colWidths);

      // get scrollElement width
      if (!scrollWidthRef.current) {
        const scrollDiv = (root.getElementsByClassName('table')?.[0] as HTMLDivElement);
        if (scrollDiv) {
          scrollWidthRef.current = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        }
      }

      // get sizes of columns
      const clientWidth = rootWidth - (scrollWidthRef.current ?? 0);
      const fixedWidth = schema.reduce<number>((sum, item) => sum += typeof item.resizable === 'boolean' && !item.resizable ? (item.width ?? minColWidth) : 0, 0);
      const resizableWidth = clientWidth - fixedWidth;
      const fixedWidthPercent = Math.round(fixedWidth / (rootWidth / 100));
      const resizablePercent = Math.round(100 - fixedWidthPercent);
      const totalWidth = widthIterator.reduce<number>((sum, [prop, colWidth]) =>  sum += colWidth, 0);
      const fullWidths: Record<string, number> = {};
      let newClientWidth = 0;

      for (let i = 0; i < widthIterator.length; i++) {
        const [prop, colWidth] = widthIterator[i];
        const colSchema: TableSchema = schema[i];
        const width = colWidth >= minColWidth ? colWidth : minColWidth;
        const widthPercentage = Math.round(width / ((totalWidth - fixedWidth) / resizablePercent));
  
        if (colSchema && (typeof colSchema.resizable === "undefined" || colSchema.resizable)) {
          const newWidth = Math.round(resizableWidth / resizablePercent * widthPercentage);
          const currentWidth = newWidth >= minColWidth ? newWidth : minColWidth;
          fullWidths[prop] = currentWidth;
          newClientWidth += currentWidth;
        }
        else {
          const currentWidth = colSchema.width ?? minColWidth;
          fullWidths[prop] = currentWidth;
          newClientWidth += currentWidth;
        }
      }
  
      if (clientWidth !== newClientWidth) {
        let rest = newClientWidth - clientWidth;
        if (rest !== 0) {
          Object.entries(fullWidths).forEach(([prop, colWidth], i) =>  {
            const colSchema: TableSchema = schema[i];
            if (colSchema && (typeof colSchema.resizable === "undefined" || colSchema.resizable)) {
              if (rest > 0 && colWidth > minColWidth) {
                if (colWidth - rest >= minColWidth) {
                  fullWidths[prop] = colWidth - rest;
                  rest = 0;
                }
                else {
                  fullWidths[prop] = minColWidth;
                  rest -= (colWidth - minColWidth);
                }
              }
              else if (rest < 0) {
                fullWidths[prop] = colWidth + Math.abs(rest);
                rest = 0;
              }
            }
          });
        }
      }

      setColWidths(fullWidths);
    }
  }, [rootWidth])

  function handleOnMouseMove(e: MouseEvent) {
    const colIndex = resizeColIndexRef.current;
    if (colIndex < 0 || !headerRef.current) return;
    const thElement = headerRef.current.children[colIndex] as HTMLTableCellElement;
    if (!thElement) return;
    const currentRect = thElement?.getBoundingClientRect();
    if (!currentRect) return;
    const newWidth = e.clientX - currentRect.left;
    setColWidths(prevWidths => ({
      ...prevWidths,
      [schema[colIndex].prop]: newWidth >= minColWidth ? newWidth : minColWidth
    }));
  }

  function handleOnMouseUp(e: MouseEvent) {
    setCursorDocument(false);
    setIsResizing(false);
    resizeColIndexRef.current = -1;
  }

  function setResizeColumn(colIndex: number) {
    resizeColIndexRef.current = colIndex;
    setCursorDocument(true);
    setIsResizing(true);
  }

  const setCursorDocument = (isResizing: boolean) => {
    document.body.style.cursor = isResizing ? 'col-resize' : 'auto';
  };

  return (
    <TableVirtuoso
      ref={tableRef}
      data={source}
      className='table'
      fixedItemHeight={rowHeight}
      fixedHeaderContent={() => (
        <tr
          ref={headerRef}
          className='table-header'
        >
          {schema.map((column, index) => {
            const { resizable, sortable, name, headerContent, prop, value } = column;
            const sortableCol = (typeof sortable !== 'boolean' || sortable);
            const resizableCol = (typeof resizable !== 'boolean' || resizable);
            const colWidth = `${colWidths[column.prop]}px`;
            const newSortOrder = !sortState ? 'asc' : sortState?.columnName === prop && sortState?.order === 'asc' ? 'desc' : 'asc';

            return (
              <th key={`${name}_${index}`}
                className='table-header-cell-container'
                style={{
                  width: colWidth,
                  minWidth: colWidth,
                  maxWidth: colWidth,
                  height: `${headerHeight}px`,
                  cursor: `${sortableCol && manualSort ? 'pointer' : 'auto'}`
                }}
                onClick={(e) => {
                  if (!(e.target as HTMLElement)?.className.includes('table-header-cell-title')) return;
                  if (sortableCol && manualSort) {
                    source.sort(sortBy(newSortOrder, value ?? ''));
                    setSortState({ columnName: prop, order: newSortOrder });
                  }
                }}
              >
                <div className='table-header-cell'>
                  <div className='table-header-cell-title'>{headerContent ? headerContent() : name}</div>
                  <div className='table-header-cell-control'>
                    { sortableCol && manualSort && sortState?.columnName === prop &&
                    <Icon name={sortState.order === 'asc' ? 'up' : 'down'} />}
                    <div
                      className={classNames('table-header-cell-separator', {
                        '_hoverable': resizableCol,
                        '_resizing': resizableCol && isResizing && index === resizeColIndexRef.current
                      })}
                      onMouseDown={(e) => {
                        if (!resizableCol) return;
                        setResizeColumn(index);
                      }}
                    />
                  </div>
                </div>
              </th>
            );
          }
          )}
        </tr>
        )}
      itemContent={(dataIndex, rowData) => {

        return (
          <>
            {schema.map((column, index) => {
              const cellWidth = `${colWidths[column.prop]}px`;

              return (
                <td key={`${index}_${dataIndex}`}
                  className='table-row-cell'
                  style={{
                    width: cellWidth,
                    minWidth: cellWidth,
                    maxWidth: cellWidth,
                    height: `${rowHeight}px`
                  }}
                  onClick={(event) => {
                    if (typeof column.clickable === 'boolean' && !column.clickable) return;
                    onCellClick?.({ event, rowData });
                  }}
                >
                  {column.cellContent(rowData, dataIndex)}
                </td>
              ); }
            )}
          </>
        );
        }}
      components={{
        TableRow: React.memo((props) => {
          const { item, context, ...rest } = props;
          const rowClasses = rowClassMap ? Object.entries(rowClassMap).map(([className, validate]) => validate(item, props['data-index']) ? className : '') : [];
          const className = 'table-row' + rowClasses.join(' ');

          return <tr className={className} {...rest} style={{ height: rowHeight }} />;
        })
      }}
    />
  );
};

export default Table;
